import { ErrInternalServer } from "@domain/error";
import { MaxParticipants, Tournament, UserId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type CreateTournamentUsecaseInput = {
	organizerId: string;
	maxParticipants?: number;
};

export class CreateTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: CreateTournamentUsecaseInput): Promise<Tournament> {
		const organizerId = new UserId(input.organizerId);
		const maxParticipants = input.maxParticipants
			? new MaxParticipants(input.maxParticipants)
			: undefined;

		const tournament = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

			const newTournament = Tournament.create({
				organizerId,
				maxParticipants,
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
