import type { ITransaction } from "../../usecase/transaction";
import { ErrBadRequest, ErrNotFound } from "../error";
import { Match } from "../model/match";
import type { User } from "../model/user";
import type { IMatchmakingQueueRepository } from "../repository/matchmaking_queue_repository";
import type { IMatchmakingClientRepository } from "../../infra/in_memory/matchmaking_client_repository";

export class MatchmakingService {
	constructor(
		private readonly transaction: ITransaction,
		private readonly matchmakingQueueRepository: IMatchmakingQueueRepository,
		private readonly matchmakingClientRepository: IMatchmakingClientRepository,
	) {}

	async join(user: User): Promise<Match | undefined> {
		const newMatch = await this.transaction.exec(async (repo) => {
			const matchRepository = repo.newMatchRepository();
			const userRepository = repo.newUserRepository();

			const existingMatch = await matchRepository.findInProgressMatchByUserId(
				user.id.value,
			);
			if (existingMatch) {
				throw new ErrBadRequest({
					userMessage: "ユーザーは既に試合に参加しています。",
				});
			}

			await this.matchmakingQueueRepository.add(user);
			const matchedUserIds = await this.matchmakingQueueRepository.pop();

			if (matchedUserIds) {
				const [user1Id, user2Id] = matchedUserIds;

				const user1 = await userRepository.findById(user1Id);
				const user2 = await userRepository.findById(user2Id);

				if (!user1 || !user2) {
					throw new ErrNotFound();
				}

				const match = Match.create([user1, user2]);
				const savedMatch = await matchRepository.save(match);
				const participants = [user1, user2];

				for (const participant of participants) {
					const client = this.matchmakingClientRepository.findByUserId(
						participant.id.value,
					);
					if (client) {
						console.log(
							`[WS Matchmaking] Sending matchFound to ${participant.id.value}`,
						);
						const payload = {
							event: "matchFound",
							data: {
								id: savedMatch.id,
								participants: savedMatch.participants.map((p) => ({
									id: p.id.value,
								})),
								status: savedMatch.status,
								gameType: savedMatch.gameType,
								createdAt: savedMatch.createdAt,
							},
						};
						client.send(JSON.stringify(payload));
					}
				}

				await this.matchmakingQueueRepository.remove(user1Id.value);
				await this.matchmakingQueueRepository.remove(user2Id.value);

				return savedMatch;
			}

			return undefined;
		});

		return newMatch;
	}

	async leave(userId: string): Promise<void> {
		await this.matchmakingQueueRepository.remove(userId);
	}
}
