import { ErrBadRequest } from "@domain/error";
import type {
	Tournament,
	TournamentMatch,
	TournamentParticipant,
	TournamentRound,
} from "@domain/model";
import { TournamentId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type GetTournamentDetailUsecaseInput = {
	tournamentId: string;
};

export type GetTournamentDetailUsecaseOutput = {
	tournament: Tournament;
	participants: TournamentParticipant[];
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

			// トーナメント取得
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// 参加者取得
			const participants =
				await tournamentRepo.findParticipantsByTournamentId(tournamentId);

			// ラウンド取得
			const rounds =
				await tournamentRepo.findRoundsByTournamentId(tournamentId);

			// 試合取得
			const matches =
				await tournamentRepo.findMatchesByTournamentId(tournamentId);

			return {
				tournament,
				participants,
				rounds,
				matches,
			};
		});

		return result;
	}
}
