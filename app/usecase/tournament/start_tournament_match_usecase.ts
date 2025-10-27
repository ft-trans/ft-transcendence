import { ErrBadRequest } from "@domain/error";
import { Match, TournamentMatchId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type StartTournamentMatchUsecaseInput = {
	tournamentMatchId: string;
};

export type StartTournamentMatchUsecaseOutput = {
	matchId: string;
};

export class StartTournamentMatchUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: StartTournamentMatchUsecaseInput,
	): Promise<StartTournamentMatchUsecaseOutput> {
		const tournamentMatchId = new TournamentMatchId(input.tournamentMatchId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();
			const matchRepo = repo.newMatchRepository();

			// 1. TournamentMatchを取得
			const tournamentMatch =
				await tournamentRepo.findMatchById(tournamentMatchId);
			if (!tournamentMatch) {
				throw new ErrBadRequest({
					userMessage: "トーナメント試合が見つかりません",
				});
			}

			// 2. バリデーション: ステータスが"pending"であることを確認
			if (!tournamentMatch.status.isPending()) {
				throw new ErrBadRequest({
					userMessage: "待機中の試合のみ開始できます",
				});
			}

			// 3. バリデーション: 参加者が2人いることを確認（BYEでない）
			if (tournamentMatch.participantIds.length !== 2) {
				throw new ErrBadRequest({
					userMessage: "試合には2人の参加者が必要です",
				});
			}

			// 4. バリデーション: Tournamentが"in_progress"ステータスであることを確認
			const tournament = await tournamentRepo.findById(
				tournamentMatch.tournamentId,
			);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}
			if (!tournament.status.isInProgress()) {
				throw new ErrBadRequest({
					userMessage: "進行中のトーナメントの試合のみ開始できます",
				});
			}

			// 5. TournamentParticipantからUserを取得
			const participant1 = await tournamentRepo.findParticipantById(
				tournamentMatch.participantIds[0],
			);
			const participant2 = await tournamentRepo.findParticipantById(
				tournamentMatch.participantIds[1],
			);

			if (!participant1 || !participant2) {
				throw new ErrBadRequest({
					userMessage: "参加者情報が見つかりません",
				});
			}

			const user1 = await userRepo.findById(participant1.userId);
			const user2 = await userRepo.findById(participant2.userId);

			if (!user1 || !user2) {
				throw new ErrBadRequest({
					userMessage: "ユーザーが見つかりません",
				});
			}

			// 6. 通常のMatchを作成（gameType: "Pong"）
			const match = Match.create([user1, user2], "Pong");
			await matchRepo.save(match);

			// 7. TournamentMatch.matchIdに紐づけて"in_progress"に更新
			const startedTournamentMatch = tournamentMatch.start(match.id);
			await tournamentRepo.updateMatch(startedTournamentMatch);

			return {
				matchId: match.id,
			};
		});

		return result;
	}
}
