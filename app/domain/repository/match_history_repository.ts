import type { MatchHistory } from "../model/match_history";

export interface IMatchHistoryRepository {
	save(matchHistory: MatchHistory): Promise<MatchHistory>;
	findByUserId(userId: string): Promise<MatchHistory[]>;
}
