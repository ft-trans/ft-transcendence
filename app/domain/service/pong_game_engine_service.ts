import { ErrBadRequest, ErrInternalServer, ErrNotFound } from "@domain/error";
import type { PongGameEvent, PongGameStateResponse } from "@shared/api/pong";
import {
	MatchHistory,
	type MatchId,
	PongGame,
	type PongMatchState,
} from "../model";
import type { IMatchHistoryRepository } from "../repository/match_history_repository";
import type { IMatchRepository } from "../repository/match_repository";
import type { IPongBallRepository } from "../repository/pong_ball_repository";
import type { IPongClientRepository } from "../repository/pong_client_repository";
import type { IPongMatchStateRepository } from "../repository/pong_match_state_repository";
import type { IPongPaddleRepository } from "../repository/pong_paddle_repository";
import type { PongLoopService } from "./pong_loop_service";

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
