import type { Ball, MatchId } from "../model";

export interface IBallRepository {
	set(matchId: MatchId, ball: Ball): Promise<Ball>;
	get(matchId: MatchId): Promise<Ball | undefined>;
	delete(matchId: MatchId): Promise<void>;
}
