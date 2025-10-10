import type { MatchHistory, UserId } from "../model";

export interface IMatchHistoryRepository {
	create(matchHistory: MatchHistory): Promise<MatchHistory>;
	// findByUserId(userId: string): Promise<MatchHistory[]>;
	countWinByUserId(userId: UserId): Promise<number>;
	countLossByUserId(userId: UserId): Promise<number>;
}
