import type { IntervalId, MatchId } from "../model";

export interface IIntervalIdRepository {
	set(matchId: MatchId, intervalId: IntervalId): Promise<IntervalId>;
	get(matchId: MatchId): Promise<IntervalId | undefined>;
	delete(matchId: MatchId): Promise<void>;
}
