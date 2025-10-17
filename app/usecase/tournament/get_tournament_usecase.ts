import { ErrBadRequest } from "@domain/error";
import { TournamentId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type GetTournamentUsecaseInput = {
	tournamentId: string; // TournamentId
};

export type GetTournamentUsecaseOutput = {
	tournament: {
		id: string;
		organizerId: string;
		status: string;
		maxParticipants: number;

		participants: {
			id: string;
			userId: string;
			username: string;
			avatarUrl?: string;
			status: string; // "active" | "eliminated" | "withdrawn"
		}[];
	};
};

export class GetTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: GetTournamentUsecaseInput,
	): Promise<GetTournamentUsecaseOutput> {
		const tournamentId = new TournamentId(input.tournamentId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();

			// トーナメントの存在確認
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// 参加者一覧を取得
			const participants =
				await tournamentRepo.findParticipantsByTournamentId(tournamentId);

			// 参加者のユーザー情報を取得
			const participantDetails = await Promise.all(
				participants.map(async (participant) => {
					const user = await userRepo.findById(participant.userId);
					return {
						id: participant.id.value,
						userId: participant.userId.value,
						username: user?.username.value || "Unknown",
						avatarUrl: user?.avatar.value,
						status: participant.status.value,
					};
				}),
			);

			return {
				tournament: {
					id: tournament.id.value,
					organizerId: tournament.organizerId.value,
					status: tournament.status.value,
					maxParticipants: tournament.maxParticipants.value,
					participants: participantDetails,
				},
			};
		});

		return result;
	}
}
