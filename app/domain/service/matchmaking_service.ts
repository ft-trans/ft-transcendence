import type { ITransaction } from "../../usecase/transaction";
import { Match } from "../model/match";
import type { User } from "../model/user";
import type { IMatchRepository } from "../repository/match_repository";

export interface IMatchmakingQueue {
	add(user: User): Promise<void>;
	remove(userId: string): Promise<void>;
	findMatch(): Promise<[User, User] | null>;
}

export class MatchmakingService {
	constructor(
		private readonly transaction: ITransaction,
		private readonly matchRepository: IMatchRepository,
		private readonly matchmakingQueue: IMatchmakingQueue,
	) {}

	async join(user: User): Promise<Match | null> {
		// 既に進行中の試合がないか確認
		const existingMatch =
			await this.matchRepository.findInProgressMatchByUserId(user.id.value);
		if (existingMatch) {
			throw new Error("User is already in a match.");
		}

		await this.matchmakingQueue.add(user);
		const matchedUsers = await this.matchmakingQueue.findMatch();

		if (matchedUsers) {
			let newMatch: Match | null = null;
			await this.transaction.exec(async () => {
				const match = Match.create(matchedUsers);
				newMatch = await this.matchRepository.save(match);
				// キューからマッチしたユーザーを削除
				await this.matchmakingQueue.remove(matchedUsers[0].id.value);
				await this.matchmakingQueue.remove(matchedUsers[1].id.value);
			});
			// WebSocketなどでマッチング成功を通知する
			return newMatch;
		}
		return null;
	}

	async leave(userId: string): Promise<void> {
		await this.matchmakingQueue.remove(userId);
	}
}
