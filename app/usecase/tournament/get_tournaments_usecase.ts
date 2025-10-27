import type { ITransaction } from "@usecase/transaction";

export type GetTournamentsUsecaseOutput = {
	tournaments: {
		id: string;
		organizerId: string;
		status: string;
		maxParticipants: number;
		organizer: {
			id: string;
			username: string;
			avatarUrl?: string;
		};
	}[];
};

export class GetTournamentsUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(): Promise<GetTournamentsUsecaseOutput> {
		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const ret = await tournamentRepo.findMany();
			const userIds = ret.map((t) => t.organizerId);
			const userRepo = repo.newUserRepository();
			const users = await userRepo.findByIds(userIds);
			const userMap = new Map(users.map((u) => [u.id.value, u]));

			return ret.map((t) => ({
				...t,
				organizer: {
					id: t.organizerId.value,
					username:
						userMap.get(t.organizerId.value)?.username.value || "Unknown",
					avatarUrl: userMap.get(t.organizerId.value)?.avatar.value,
				},
			}));
		});

		return {
			tournaments: result.map((t) => ({
				id: t.id.value,
				organizerId: t.organizerId.value,
				status: t.status.value,
				maxParticipants: t.maxParticipants.value,
				organizer: t.organizer,
			})),
		};
	}
}
