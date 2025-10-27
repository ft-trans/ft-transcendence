import { ErrInternalServer } from "@domain/error";
import {
	Tournament,
	TournamentDescription,
	TournamentName,
	UserId,
} from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type CreateTournamentUsecaseInput = {
	name: string;
	description?: string;
	organizerId: string;
};

export class CreateTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: CreateTournamentUsecaseInput): Promise<Tournament> {
		const name = new TournamentName(input.name);
		const description = input.description
			? new TournamentDescription(input.description)
			: undefined;
		const organizerId = new UserId(input.organizerId);

		const tournament = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

			const newTournament = Tournament.create({
				name,
				description,
				organizerId,
			});

			const createdTournament = await tournamentRepo.create(newTournament);
			if (!createdTournament) {
				throw new ErrInternalServer();
			}

			return createdTournament;
		});

		return tournament;
	}
}
