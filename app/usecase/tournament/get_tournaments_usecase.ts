import type { Tournament, User } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type GetTournamentsUsecaseInput = {
	status?: string;
	limit?: number;
	offset?: number;
};

export type TournamentWithDetails = {
	tournament: Tournament;
	organizer: User;
	participantCount: number;
};

export type GetTournamentsUsecaseOutput = {
	tournaments: TournamentWithDetails[];
};

/**
 * トーナメント一覧取得ユースケース
 */
export class GetTournamentsUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: GetTournamentsUsecaseInput,
	): Promise<GetTournamentsUsecaseOutput> {
		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();

			const tournaments = await tournamentRepo.findMany({
				status: input.status,
				limit: input.limit ?? 50,
				offset: input.offset ?? 0,
			});

			// 各トーナメントのorganizer情報とparticipantCountを取得
			const tournamentsWithDetails = await Promise.all(
				tournaments.map(async (tournament) => {
					const organizer = await userRepo.findById(tournament.organizerId);
					if (!organizer) {
						throw new Error(
							`トーナメントの主催者が見つかりません: ${tournament.organizerId.value}`,
						);
					}

					const participants =
						await tournamentRepo.findParticipantsByTournamentId(tournament.id);

					return {
						tournament,
						organizer,
						participantCount: participants.length,
					};
				}),
			);

			return { tournaments: tournamentsWithDetails };
		});

		return result;
	}
}
