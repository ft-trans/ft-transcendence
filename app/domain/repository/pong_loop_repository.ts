import type { MatchId, PongLoopId } from "@domain/model";

export interface IPongLoopRepository {
	start(matchId: MatchId, processFrame: () => void): PongLoopId | undefined;
	stop(matchId: MatchId): PongLoopId | undefined;
	get(matchId: MatchId): PongLoopId | undefined;
}
