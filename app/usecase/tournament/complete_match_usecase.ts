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
} from "@domain/model";
import { TournamentBracketService } from "@domain/service";
import type { ITransaction } from "@usecase/transaction";

export type CompleteMatchUsecaseInput = {
	matchId: string;
	winnerId: string; // TournamentParticipantId
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
		const matchId = new TournamentMatchId(input.matchId);
		const winnerId = new TournamentParticipantId(input.winnerId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

			// 試合の存在確認
			const match = await tournamentRepo.findMatchById(matchId);
			if (!match) {
				throw new ErrBadRequest({
					userMessage: "試合が見つかりません",
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
					.filter((id): id is TournamentParticipantId => id !== null);

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

		return result;
	}
}
