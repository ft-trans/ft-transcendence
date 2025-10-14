import { ErrBadRequest } from "@domain/error";
import type {
	Tournament,
	TournamentMatch,
	TournamentParticipantId,
	TournamentRound,
} from "@domain/model";
import {
	RoundNumber,
	TournamentMatchId,
	TournamentRound as TournamentRoundEntity,
} from "@domain/model";
import { TournamentBracketService } from "@domain/service";
import type { ITransaction } from "@usecase/transaction";

export type CompleteMatchUsecaseInput = {
	matchId: string; // TournamentMatchId
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
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: CompleteMatchUsecaseInput,
	): Promise<CompleteMatchUsecaseOutput> {
		const tournamentMatchId = new TournamentMatchId(input.matchId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const matchHistoryRepo = repo.newMatchHistoryRepository();

			// トーナメント試合の存在確認
			const tournamentMatch =
				await tournamentRepo.findMatchById(tournamentMatchId);
			if (!tournamentMatch) {
				throw new ErrBadRequest({
					userMessage: "試合が見つかりません",
				});
			}

			// MatchHistoryから勝者を取得
			const matchHistory = await matchHistoryRepo.findByMatchId(
				tournamentMatch.matchId,
			);
			if (!matchHistory) {
				throw new ErrBadRequest({
					userMessage: "試合結果が見つかりません",
				});
			}

			// 勝者のTournamentParticipantIdを特定
			const winnerParticipant =
				await tournamentRepo.findParticipantByTournamentAndUserId(
					tournamentMatch.tournamentId,
					matchHistory.winnerId.value,
				);
			if (!winnerParticipant) {
				throw new ErrBadRequest({
					userMessage: "勝者の参加者情報が見つかりません",
				});
			}

			// 敗者を eliminated に更新
			const loserIds = tournamentMatch.participantIds.filter(
				(id) => !id.equals(winnerParticipant.id),
			);
			for (const loserId of loserIds) {
				const participant = await tournamentRepo.findParticipantById(loserId);
				if (participant) {
					const eliminatedParticipant = participant.eliminate();
					await tournamentRepo.updateParticipant(eliminatedParticipant);
				}
			}

			// 現在のラウンドを取得
			const currentRound = await tournamentRepo.findRoundById(
				tournamentMatch.roundId,
			);
			if (!currentRound) {
				throw new ErrBadRequest({
					userMessage: "ラウンドが見つかりません",
				});
			}

			// 同じラウンドの全試合を取得
			const roundMatches = await tournamentRepo.findMatchesByRoundId(
				tournamentMatch.roundId,
			);

			// ラウンド完了判定（全試合のMatchHistoryが存在するか）
			const matchHistories = await Promise.all(
				roundMatches.map((m) => matchHistoryRepo.findByMatchId(m.matchId)),
			);
			const isRoundCompleted = matchHistories.every((h) => h !== undefined);

			let nextRound: TournamentRound | undefined;
			let nextMatches: TournamentMatch[] | undefined;
			let tournament: Tournament | undefined;

			if (isRoundCompleted) {
				// ラウンドを完了状態に更新
				const completedRound = currentRound.complete();
				await tournamentRepo.updateRound(completedRound);

				// 勝者を収集
				const winners: TournamentParticipantId[] = [];
				for (let i = 0; i < roundMatches.length; i++) {
					const history = matchHistories[i];
					if (history) {
						const participant =
							await tournamentRepo.findParticipantByTournamentAndUserId(
								tournamentMatch.tournamentId,
								history.winnerId.value,
							);
						if (participant) {
							winners.push(participant.id);
						}
					}
				}

				// トーナメント完了判定（勝者が1人だけ）
				const isTournamentCompleted = winners.length === 1;

				if (isTournamentCompleted) {
					// トーナメントを完了状態に更新
					const tournamentEntity = await tournamentRepo.findById(
						tournamentMatch.tournamentId,
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
						tournamentMatch.tournamentId,
						nextRoundNumber,
					);
					const createdNextRound = await tournamentRepo.createRound(nextRound);

					// 次のラウンドの試合を生成
					const bracketService = new TournamentBracketService();
					const newMatches = bracketService.generateNextRoundMatches(
						tournamentMatch.tournamentId,
						createdNextRound.id,
						winners,
					);

					// 試合を作成
					nextMatches = await Promise.all(
						newMatches.map((m) => tournamentRepo.createMatch(m)),
					);
				}

				return {
					match: tournamentMatch,
					isRoundCompleted: true,
					isTournamentCompleted,
					nextRound: nextRound,
					nextMatches,
					tournament,
				};
			}

			return {
				match: tournamentMatch,
				isRoundCompleted: false,
				isTournamentCompleted: false,
			};
		});

		return result;
	}
}
