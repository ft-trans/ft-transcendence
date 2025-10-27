import { ErrBadRequest } from "@domain/error";
import type {
	Tournament,
	TournamentMatch,
	TournamentRound,
} from "@domain/model";
import {
	RoundNumber,
	TournamentMatchId,
	TournamentParticipantId,
	TournamentRound as TournamentRoundEntity,
	UserId,
} from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TournamentBracketService } from "@domain/service";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import type { ITransaction } from "@usecase/transaction";

export type CompleteMatchUsecaseInput = {
	matchId: string;
	winnerId: string; // TournamentParticipantId
	requesterId: string; // UserId - リクエストを送信したユーザー
};

export type CompleteMatchUsecaseOutput = {
	match: TournamentMatch;
	isRoundCompleted: boolean;
	isTournamentCompleted: boolean;
	nextRound?: TournamentRound;
	nextMatches?: TournamentMatch[];
	tournament?: Tournament;
};

export class CompleteMatchUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: CompleteMatchUsecaseInput,
	): Promise<CompleteMatchUsecaseOutput> {
		const matchId = new TournamentMatchId(input.matchId);
		const winnerId = new TournamentParticipantId(input.winnerId);
		const requesterId = new UserId(input.requesterId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

			// 試合の存在確認
			const match = await tournamentRepo.findMatchById(matchId);
			if (!match) {
				throw new ErrBadRequest({
					userMessage: "試合が見つかりません",
				});
			}

			// 試合がin_progressステータスであることを確認
			if (!match.status.isInProgress()) {
				throw new ErrBadRequest({
					userMessage: "この試合は進行中ではありません",
				});
			}

			// 重複した結果報告の防止
			if (match.winnerId !== undefined) {
				throw new ErrBadRequest({
					userMessage: "この試合は既に結果が報告されています",
				});
			}

			// トーナメントを取得して主催者かどうか確認
			const tournamentForAuth = await tournamentRepo.findById(
				match.tournamentId,
			);
			if (!tournamentForAuth) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// 勝者が試合の参加者であることを確認
			if (!match.participantIds.some((id) => id.equals(winnerId))) {
				throw new ErrBadRequest({
					userMessage: "指定された勝者は試合の参加者ではありません",
				});
			}

			// リクエスト者の権限チェック（主催者または試合参加者のみ）
			const isOrganizer = tournamentForAuth.isOrganizer(requesterId);

			// 試合参加者かどうかをチェック
			const matchParticipants = await Promise.all(
				match.participantIds.map((id) =>
					tournamentRepo.findParticipantById(id),
				),
			);
			const isMatchParticipant = matchParticipants.some((p) =>
				p?.userId.equals(requesterId),
			);

			if (!isOrganizer && !isMatchParticipant) {
				throw new ErrBadRequest({
					userMessage: "試合結果を報告する権限がありません",
				});
			}

			// 試合を完了状態に更新
			const completedMatch = match.complete(winnerId);
			await tournamentRepo.updateMatch(completedMatch);

			// 敗者を eliminated に更新
			const loserIds = completedMatch.participantIds.filter(
				(id) => !id.equals(winnerId),
			);
			for (const loserId of loserIds) {
				const participant = await tournamentRepo.findParticipantById(loserId);
				if (participant) {
					const eliminatedParticipant = participant.eliminate();
					await tournamentRepo.updateParticipant(eliminatedParticipant);
				}
			}

			// 現在のラウンドを取得
			const currentRound = await tournamentRepo.findRoundById(match.roundId);
			if (!currentRound) {
				throw new ErrBadRequest({
					userMessage: "ラウンドが見つかりません",
				});
			}

			// 同じラウンドの全試合を取得
			const roundMatches = await tournamentRepo.findMatchesByRoundId(
				match.roundId,
			);

			// ラウンド完了判定（全試合がcompletedか）
			const isRoundCompleted = roundMatches.every((m) =>
				m.status.isCompleted(),
			);

			let nextRound: TournamentRound | undefined;
			let nextMatches: TournamentMatch[] | undefined;
			let tournament: Tournament | undefined;

			if (isRoundCompleted) {
				// ラウンドを完了状態に更新
				const completedRound = currentRound.complete();
				await tournamentRepo.updateRound(completedRound);

				// 勝者を収集
				const winners = roundMatches
					.map((m) => m.winnerId)
					.filter((id): id is TournamentParticipantId => id !== undefined);

				// トーナメント完了判定（勝者が1人だけ）
				const isTournamentCompleted = winners.length === 1;

				if (isTournamentCompleted) {
					// トーナメントを完了状態に更新
					const tournamentEntity = await tournamentRepo.findById(
						match.tournamentId,
					);
					if (tournamentEntity) {
						tournament = tournamentEntity.complete();
						await tournamentRepo.update(tournament);
					}
				} else {
					// 次のラウンドを作成
					const nextRoundNumber = new RoundNumber(
						currentRound.roundNumber.value + 1,
					);
					nextRound = TournamentRoundEntity.create(
						match.tournamentId,
						nextRoundNumber,
					);
					const createdNextRound = await tournamentRepo.createRound(nextRound);

					// 次のラウンドの試合を生成
					const bracketService = new TournamentBracketService();
					const newMatches = bracketService.generateNextRoundMatches(
						match.tournamentId,
						createdNextRound.id,
						winners,
					);

					// 試合を作成
					nextMatches = await Promise.all(
						newMatches.map((m) => tournamentRepo.createMatch(m)),
					);
				}

				return {
					match: completedMatch,
					isRoundCompleted: true,
					isTournamentCompleted,
					nextRound: nextRound,
					nextMatches,
					tournament,
				};
			}

			return {
				match: completedMatch,
				isRoundCompleted: false,
				isTournamentCompleted: false,
			};
		});

		// WebSocket通知
		if (this.tournamentClientRepository) {
			const tournamentId = result.match.tournamentId;
			const clients =
				this.tournamentClientRepository.findByTournamentId(tournamentId);

			// 1. 試合完了通知
			for (const client of clients) {
				try {
					client.send({
						type: TOURNAMENT_WS_EVENTS.MATCH_COMPLETED,
						payload: {
							tournamentId: tournamentId.value,
							matchId: result.match.id.value,
							winnerId: result.match.winnerId?.value ?? "",
							match: {
								id: result.match.id.value,
								tournamentId: result.match.tournamentId.value,
								roundId: result.match.roundId.value,
								matchId: result.match.matchId,
								participants: [], // TODO: 参加者情報を変換
								winnerId: result.match.winnerId?.value,
								status: result.match.status.value,
								completedAt: undefined, // TODO: Matchから取得
								createdAt: new Date().toISOString(),
							},
						},
					});
				} catch (error) {
					console.error(
						"[CompleteMatchUsecase] Failed to send match_completed event:",
						error,
					);
				}
			}

			// 2. ラウンド完了通知
			if (result.isRoundCompleted && result.nextRound) {
				for (const client of clients) {
					try {
						client.send({
							type: TOURNAMENT_WS_EVENTS.ROUND_COMPLETED,
							payload: {
								tournamentId: tournamentId.value,
								roundNumber: result.nextRound.roundNumber.value - 1,
								completedRound: {
									id: "", // TODO: completedRoundの情報を取得
									tournamentId: tournamentId.value,
									roundNumber: result.nextRound.roundNumber.value - 1,
									status: "completed",
									matches: [],
									createdAt: new Date().toISOString(),
								},
								nextRound: {
									id: result.nextRound.id.value,
									tournamentId: result.nextRound.tournamentId.value,
									roundNumber: result.nextRound.roundNumber.value,
									status: result.nextRound.status.value,
									matches: [], // TODO: matchesを変換
									createdAt: new Date().toISOString(),
								},
							},
						});
					} catch (error) {
						console.error(
							"[CompleteMatchUsecase] Failed to send round_completed event:",
							error,
						);
					}
				}
			}

			// 3. トーナメント完了通知
			if (result.isTournamentCompleted && result.tournament) {
				const winnerId = result.match.winnerId;
				if (winnerId) {
					for (const client of clients) {
						try {
							client.send({
								type: TOURNAMENT_WS_EVENTS.TOURNAMENT_COMPLETED,
								payload: {
									tournamentId: tournamentId.value,
									tournament: {
										id: result.tournament.id.value,
										name: result.tournament.id.value, // TODO: name フィールドを追加
										organizerId: result.tournament.organizerId.value,
										organizer: {
											id: result.tournament.organizerId.value,
											username: "", // TODO: ユーザー情報から取得
											avatar: "",
										},
										status: result.tournament.status.value,
										maxParticipants: result.tournament.maxParticipants.value,
										participantCount: 0, // TODO: 参加者数を取得
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
									},
									winnerId: winnerId.value,
									winner: {
										id: winnerId.value,
										tournamentId: tournamentId.value,
										userId: "", // TODO: TournamentParticipantからuserIdを取得
										user: {
											id: "",
											username: "",
											avatar: "",
										},
										status: "active",
									},
								},
							});
						} catch (error) {
							console.error(
								"[CompleteMatchUsecase] Failed to send tournament_completed event:",
								error,
							);
						}
					}
				}
			}
		}

		return result;
	}
}
