import type { MatchHistory } from "../model/match_history";

export interface IMatchHistoryRepository {
	create(matchHistory: MatchHistory): Promise<MatchHistory>;
	// findByUserId(userId: string): Promise<MatchHistory[]>;
}
