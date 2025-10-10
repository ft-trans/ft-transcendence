import type { MatchHistory, UserId } from "../model";

export interface IMatchHistoryRepository {
	create(matchHistory: MatchHistory): Promise<MatchHistory>;
	findByUserIdWithPagination(
		userId: UserId,
		page: number,
	): Promise<MatchHistory[]>;
	countWinByUserId(userId: UserId): Promise<number>;
	countLossByUserId(userId: UserId): Promise<number>;
}
