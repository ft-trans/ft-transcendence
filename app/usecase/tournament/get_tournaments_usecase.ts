import type { Tournament } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type GetTournamentsUsecaseInput = {
	status?: string;
	limit?: number;
	offset?: number;
};

export type GetTournamentsUsecaseOutput = {
	tournaments: Tournament[];
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

			const tournaments = await tournamentRepo.findMany({
				status: input.status,
				limit: input.limit ?? 50,
				offset: input.offset ?? 0,
			});

			return { tournaments };
		});

		return result;
	}
}
