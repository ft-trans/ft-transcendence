import { ErrBadRequest } from "@domain/error";
import type {
	Tournament,
	TournamentMatch,
	TournamentParticipant,
	TournamentRound,
	User,
} from "@domain/model";
import { TournamentId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type GetTournamentDetailUsecaseInput = {
	tournamentId: string;
};

export type GetTournamentDetailUsecaseOutput = {
	tournament: Tournament;
	organizer: User;
	participants: Array<{ participant: TournamentParticipant; user: User }>;
	rounds: TournamentRound[];
	matches: TournamentMatch[];
};

/**
 * トーナメント詳細取得ユースケース
 */
export class GetTournamentDetailUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: GetTournamentDetailUsecaseInput,
	): Promise<GetTournamentDetailUsecaseOutput> {
		const tournamentId = new TournamentId(input.tournamentId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();

			// トーナメント取得
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// 主催者取得
			const organizer = await userRepo.findById(tournament.organizerId);
			if (!organizer) {
				throw new ErrBadRequest({
					userMessage: "主催者が見つかりません",
				});
			}

			// 参加者取得
			const participants =
				await tournamentRepo.findParticipantsByTournamentId(tournamentId);

			// 参加者のユーザー情報を取得
			const participantsWithUsers = await Promise.all(
				participants.map(async (participant) => {
					const user = await userRepo.findById(participant.userId);
					if (!user) {
						throw new ErrBadRequest({
							userMessage: `参加者のユーザー情報が見つかりません: ${participant.userId.value}`,
						});
					}
					return { participant, user };
				}),
			);

			// ラウンド取得
			const rounds =
				await tournamentRepo.findRoundsByTournamentId(tournamentId);

			// 試合取得
			const matches =
				await tournamentRepo.findMatchesByTournamentId(tournamentId);

			return {
				tournament,
				organizer,
				participants: participantsWithUsers,
				rounds,
				matches,
			};
		});

		return result;
	}
}
