import { ErrBadRequest, ErrInternalServer, ErrNotFound } from "@domain/error";
import type { PongGameEvent, PongGameStateResponse } from "@shared/api/pong";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import {
	MatchHistory,
	type MatchId,
	PongGame,
	type PongMatchState,
	RoundNumber,
	type TournamentParticipantId,
	TournamentRound,
} from "../model";
import type { IMatchHistoryRepository } from "../repository/match_history_repository";
import type { IMatchRepository } from "../repository/match_repository";
import type { IPongBallRepository } from "../repository/pong_ball_repository";
import type { IPongClientRepository } from "../repository/pong_client_repository";
import type { IPongMatchStateRepository } from "../repository/pong_match_state_repository";
import type { IPongPaddleRepository } from "../repository/pong_paddle_repository";
import type { ITournamentClientRepository } from "../repository/tournament_client_repository";
import type { ITournamentRepository } from "../repository/tournament_repository";
import type { PongLoopService } from "./pong_loop_service";
import { TournamentBracketService } from "./tournament_bracket_service";

export class PongGameEngineService {
	constructor(
		private readonly matchId: MatchId,
		private readonly pongBallRepo: IPongBallRepository,
		private readonly pongPaddleRepo: IPongPaddleRepository,
		private readonly pongClientRepo: IPongClientRepository,
		private readonly pongMatchStateRepo: IPongMatchStateRepository,
		private readonly matchRepo: IMatchRepository,
		private readonly pongLoopService: PongLoopService,
		private readonly matchHistoryRepo: IMatchHistoryRepository,
		private readonly tournamentRepo?: ITournamentRepository,
		private readonly tournamentClientRepo?: ITournamentClientRepository,
	) {}

	// Processing one frame
	// this function is called in setInterval
	async processFrame() {
		const ball = await this.pongBallRepo.get(this.matchId);
		const paddle1 = await this.pongPaddleRepo.get(this.matchId, "player1");
		const paddle2 = await this.pongPaddleRepo.get(this.matchId, "player2");
		const state = this.pongMatchStateRepo.get(this.matchId);
		try {
			if (state.isOver()) {
				await this.finishMatch(state);
				await this.stopLoopAndCleanup();
				return;
			}
			const pongGame = PongGame.createAndStart(
				ball,
				{ player1: paddle1, player2: paddle2 },
				state,
			);
			const newPongGame = pongGame.calculateFrame();

			const message = JSON.stringify(this.toResponse("gameState", newPongGame));
			this.sendData(message);

			await this.saveData(newPongGame);
		} catch (error) {
			await this.handleError(error as Error);
		}
	}

	async handleError(error: Error) {
		let errMsg = "エラーが発生しました。";
		if (error instanceof ErrNotFound) {
			errMsg = "対戦データが見つかりません。";
		} else if (error instanceof ErrBadRequest) {
			errMsg = `不正なリクエストです。 ${error.details?.match} `;
		} else if (error instanceof ErrInternalServer) {
			errMsg = `内部サーバーエラーが発生しました。`;
		}
		const message = JSON.stringify(this.toResponse("error", undefined, errMsg));
		this.sendData(message);
		await this.stopLoopAndCleanup();
	}

	private async finishMatch(state: PongMatchState) {
		const match = await this.matchRepo.findById(this.matchId.value);
		if (!match) {
			throw new ErrInternalServer({ systemMessage: "Match not found" });
		}
		if (match.status === "completed") {
			return;
		}
		match.complete();
		await this.matchRepo.save(match);
		await this.createMatchHistory(state);

		// トーナメント試合の場合は、TournamentMatchも完了させる
		if (this.tournamentRepo) {
			await this.completeTournamentMatch(state);
		}
	}

	private async completeTournamentMatch(state: PongMatchState) {
		if (!this.tournamentRepo) {
			return;
		}

		try {
			// MatchIdからTournamentMatchを検索
			const tournamentMatch = await this.tournamentRepo.findMatchByMatchId(
				this.matchId.value,
			);

			if (!tournamentMatch) {
				// トーナメント試合ではない場合は何もしない
				return;
			}

			await this.processTournamentMatchCompletion(state, tournamentMatch);
		} catch (error) {
			console.error(
				"[PongGameEngineService] Error in completeTournamentMatch:",
				error,
			);
			throw error;
		}
	}

	private async processTournamentMatchCompletion(
		state: PongMatchState,
		tournamentMatch: any,
	) {
		if (!this.tournamentRepo) {
			return;
		}

		// 勝者のUserIdを特定
		const winnerId =
			state.score.player1 > state.score.player2
				? state.playerIds.player1
				: state.playerIds.player2;

		// UserIdからTournamentParticipantIdを取得
		const participants = await Promise.all(
			tournamentMatch.participantIds.map((id) =>
				this.tournamentRepo!.findParticipantById(id),
			),
		);

		const winnerParticipant = participants.find((p) =>
			p?.userId.equals(winnerId),
		);

		if (!winnerParticipant) {
			console.error(
				"[PongGameEngineService] Winner participant not found in tournament",
			);
			return;
		}

		// TournamentMatchを完了状態に更新
		const completedMatch = tournamentMatch.complete(winnerParticipant.id);
		await this.tournamentRepo.updateMatch(completedMatch);

		// 敗者を eliminated に更新
		const loserParticipants = participants.filter(
			(p) => p && !p.userId.equals(winnerId),
		);
		for (const participant of loserParticipants) {
			if (participant) {
				const eliminatedParticipant = participant.eliminate();
				await this.tournamentRepo.updateParticipant(eliminatedParticipant);
			}
		}

		// 現在のラウンドを取得
		const currentRound = await this.tournamentRepo.findRoundById(
			completedMatch.roundId,
		);
		if (!currentRound) {
			console.error("[PongGameEngineService] Round not found");
			return;
		}

		// 同じラウンドの全試合を取得
		const roundMatches = await this.tournamentRepo.findMatchesByRoundId(
			completedMatch.roundId,
		);

		// ラウンド完了判定（全試合がcompletedか）
		const isRoundCompleted = roundMatches.every((m) => m.status.isCompleted());
		console.log(
			`[PongGameEngineService] Round ${currentRound.roundNumber.value} completed: ${isRoundCompleted}`,
		);
		console.log(
			`[PongGameEngineService] Round matches:`,
			roundMatches.map((m) => ({ id: m.id.value, status: m.status.value })),
		);

		// WebSocket通知: 試合完了
		this.notifyMatchCompleted(completedMatch);

		console.log(
			`[PongGameEngineService] About to check if isRoundCompleted: ${isRoundCompleted}`,
		);
		if (isRoundCompleted) {
			console.log(`[PongGameEngineService] Entering isRoundCompleted block`);

			// ラウンドを完了状態に更新（必要なら先にstartする）
			let roundToComplete = currentRound;
			if (currentRound.status.isPending()) {
				console.log(
					`[PongGameEngineService] Round is pending, starting it first`,
				);
				roundToComplete = currentRound.start();
				await this.tournamentRepo.updateRound(roundToComplete);
			}

			const completedRound = roundToComplete.complete();
			console.log(
				`[PongGameEngineService] Completed round status: ${completedRound.status.value}`,
			);
			await this.tournamentRepo.updateRound(completedRound);
			console.log(`[PongGameEngineService] Updated round in DB`);

			// 勝者を収集
			const winners = roundMatches
				.map((m) => m.winnerId)
				.filter((id): id is TournamentParticipantId => id !== undefined);
			console.log(
				`[PongGameEngineService] Winners count: ${winners.length}`,
				winners.map((w) => w.value),
			);

			// トーナメント完了判定（勝者が1人だけ）
			const isTournamentCompleted = winners.length === 1;

			if (isTournamentCompleted) {
				// トーナメントを完了状態に更新
				const tournament = await this.tournamentRepo.findById(
					completedMatch.tournamentId,
				);
				if (tournament) {
					const completedTournament = tournament.complete();
					await this.tournamentRepo.update(completedTournament);

					// WebSocket通知: トーナメント完了
					this.notifyTournamentCompleted(
						completedTournament,
						winnerParticipant,
					);
				}
			} else {
				// 次のラウンドを作成
				const nextRoundNumber = new RoundNumber(
					currentRound.roundNumber.value + 1,
				);
				console.log(
					`[PongGameEngineService] Creating next round: ${nextRoundNumber.value}`,
				);
				const nextRound = TournamentRound.create(
					completedMatch.tournamentId,
					nextRoundNumber,
				);
				const createdNextRound =
					await this.tournamentRepo.createRound(nextRound);
				console.log(
					`[PongGameEngineService] Created next round: ${createdNextRound.id.value}`,
				);

				// 次のラウンドの試合を生成
				const bracketService = new TournamentBracketService();
				const newMatches = bracketService.generateNextRoundMatches(
					completedMatch.tournamentId,
					createdNextRound.id,
					winners,
				);
				console.log(
					`[PongGameEngineService] Generated ${newMatches.length} matches for next round`,
				);

				// 試合を作成
				await Promise.all(
					newMatches.map((m) => this.tournamentRepo!.createMatch(m)),
				);
				console.log(
					`[PongGameEngineService] Created matches for round ${nextRoundNumber.value}`,
				);

				// WebSocket通知: ラウンド完了
				this.notifyRoundCompleted(completedRound, createdNextRound);
			}
		}
	}

	private notifyMatchCompleted(match: any): void {
		if (!this.tournamentClientRepo) return;

		const clients = this.tournamentClientRepo.findByTournamentId(
			match.tournamentId,
		);
		for (const client of clients) {
			try {
				client.send({
					type: TOURNAMENT_WS_EVENTS.MATCH_COMPLETED,
					payload: {
						tournamentId: match.tournamentId.value,
						matchId: match.id.value,
						winnerId: match.winnerId?.value ?? "",
						match: {
							id: match.id.value,
							tournamentId: match.tournamentId.value,
							roundId: match.roundId.value,
							matchId: match.matchId,
							participants: [],
							winnerId: match.winnerId?.value,
							status: match.status.value,
							completedAt: undefined,
							createdAt: new Date().toISOString(),
						},
					},
				});
			} catch (error) {
				console.error(
					"[PongGameEngineService] Failed to send match_completed event:",
					error,
				);
			}
		}
	}

	private notifyRoundCompleted(completedRound: any, nextRound: any): void {
		if (!this.tournamentClientRepo) return;

		const clients = this.tournamentClientRepo.findByTournamentId(
			completedRound.tournamentId,
		);
		for (const client of clients) {
			try {
				client.send({
					type: TOURNAMENT_WS_EVENTS.ROUND_COMPLETED,
					payload: {
						tournamentId: completedRound.tournamentId.value,
						roundNumber: completedRound.roundNumber.value,
						completedRound: {
							id: completedRound.id.value,
							tournamentId: completedRound.tournamentId.value,
							roundNumber: completedRound.roundNumber.value,
							status: completedRound.status.value,
							matches: [],
							createdAt: new Date().toISOString(),
						},
						nextRound: {
							id: nextRound.id.value,
							tournamentId: nextRound.tournamentId.value,
							roundNumber: nextRound.roundNumber.value,
							status: nextRound.status.value,
							matches: [],
							createdAt: new Date().toISOString(),
						},
					},
				});
			} catch (error) {
				console.error(
					"[PongGameEngineService] Failed to send round_completed event:",
					error,
				);
			}
		}
	}

	private notifyTournamentCompleted(tournament: any, winner: any): void {
		if (!this.tournamentClientRepo) return;

		const clients = this.tournamentClientRepo.findByTournamentId(tournament.id);
		for (const client of clients) {
			try {
				client.send({
					type: TOURNAMENT_WS_EVENTS.TOURNAMENT_COMPLETED,
					payload: {
						tournamentId: tournament.id.value,
						tournament: {
							id: tournament.id.value,
							name: tournament.id.value,
							organizerId: tournament.organizerId.value,
							organizer: {
								id: tournament.organizerId.value,
								username: "",
								avatar: "",
							},
							status: tournament.status.value,
							maxParticipants: tournament.maxParticipants.value,
							participantCount: 0,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						},
						winnerId: winner.id.value,
						winner: {
							id: winner.id.value,
							tournamentId: tournament.id.value,
							userId: winner.userId.value,
							user: {
								id: winner.userId.value,
								username: "",
								avatar: "",
							},
							status: winner.status.value,
						},
					},
				});
			} catch (error) {
				console.error(
					"[PongGameEngineService] Failed to send tournament_completed event:",
					error,
				);
			}
		}
	}

	private async createMatchHistory(state: PongMatchState) {
		let matchHistory: MatchHistory;
		if (state.score.player1 > state.score.player2) {
			matchHistory = MatchHistory.create({
				matchId: this.matchId,
				winnerId: state.playerIds.player1,
				loserId: state.playerIds.player2,
				winnerScore: state.score.player1,
				loserScore: state.score.player2,
			});
		} else {
			matchHistory = MatchHistory.create({
				matchId: this.matchId,
				winnerId: state.playerIds.player2,
				loserId: state.playerIds.player1,
				winnerScore: state.score.player2,
				loserScore: state.score.player1,
			});
		}
		await this.matchHistoryRepo.create(matchHistory);
	}

	private async stopLoopAndCleanup() {
		this.pongLoopService.stop(this.matchId);

		await this.pongBallRepo.delete(this.matchId);
		await this.pongPaddleRepo.delete(this.matchId, "player1");
		await this.pongPaddleRepo.delete(this.matchId, "player2");
		await this.pongMatchStateRepo.delete(this.matchId);
		this.pongClientRepo.closeAndDeleteAll(this.matchId);
	}

	private sendData(message: string) {
		this.pongClientRepo.get(this.matchId)?.forEach((client) => {
			if (!client.isOpen()) {
				return;
			}
			client.send(message);
		});
	}

	private async saveData(newPongGame: PongGame) {
		this.pongMatchStateRepo.set(this.matchId, newPongGame.state);
		if (newPongGame.ball !== undefined) {
			await this.pongBallRepo.set(this.matchId, newPongGame.ball);
		} else {
			await this.pongBallRepo.delete(this.matchId);
		}
	}

	private toResponse(
		event: PongGameEvent,
		pongGame: PongGame | undefined,
		message?: string,
	): PongGameStateResponse {
		return {
			event: event,
			payload: pongGame
				? {
						field: pongGame.field,
						ball: pongGame.ball,
						paddles: pongGame.paddles,
						state: pongGame.state,
					}
				: undefined,
			message: message,
		};
	}
}
