import type { MatchHistory, MatchId, UserId } from "../model";

export interface IMatchHistoryRepository {
	create(matchHistory: MatchHistory): Promise<MatchHistory>;
	findByMatchId(matchId: MatchId): Promise<MatchHistory | undefined>;
	findByUserIdWithPagination(
		userId: UserId,
		page: number,
	): Promise<MatchHistory[]>;
	countWinByUserId(userId: UserId): Promise<number>;
	countLossByUserId(userId: UserId): Promise<number>;
}
