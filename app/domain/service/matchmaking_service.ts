import type { ITransaction } from "../../usecase/transaction";
import { ErrBadRequest } from "../error";
import { Match } from "../model/match";
import type { User } from "../model/user";
import type { IMatchRepository } from "../repository/match_repository";
import type { IMatchmakingQueueRepository } from "../repository/matchmaking_queue_repository";

export class MatchmakingService {
	constructor(
		private readonly transaction: ITransaction,
		private readonly matchRepository: IMatchRepository,
		private readonly matchmakingQueueRepository: IMatchmakingQueueRepository,
	) {}

	async join(user: User): Promise<Match | undefined> {
		// 既に進行中の試合がないか確認
		const existingMatch =
			await this.matchRepository.findInProgressMatchByUserId(user.id.value);
		if (existingMatch) {
			throw new ErrBadRequest({
				userMessage: "ユーザーは既に試合に参加しています。",
			});
		}

		await this.matchmakingQueueRepository.add(user);
		const matchedUsers = await this.matchmakingQueueRepository.pop();

		if (matchedUsers) {
			const newMatch: Match | undefined = await this.transaction.exec(
				async () => {
					const match = Match.create(matchedUsers);
					const savedMatch = await this.matchRepository.save(match);
					// キューからマッチしたユーザーを削除
					await this.matchmakingQueueRepository.remove(
						matchedUsers[0].id.value,
					);
					await this.matchmakingQueueRepository.remove(
						matchedUsers[1].id.value,
					);
					return savedMatch;
				},
			);
			// WebSocketなどでマッチング成功を通知する
			return newMatch;
		}
		return undefined;
	}

	async leave(userId: string): Promise<void> {
		await this.matchmakingQueueRepository.remove(userId);
	}
}
