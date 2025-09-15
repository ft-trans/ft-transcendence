import type { MatchId, PongBall } from "../model";

export interface IPongBallRepository {
	set(matchId: MatchId, ball: PongBall): Promise<PongBall>;
	get(matchId: MatchId): Promise<PongBall | undefined>;
	delete(matchId: MatchId): Promise<void>;
}
