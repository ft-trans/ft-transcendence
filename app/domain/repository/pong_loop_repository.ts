import type { MatchId, PongLoopId } from "@domain/model";

export interface IPongLoopRepository {
	set(matchId: MatchId, pongLoopId: PongLoopId): PongLoopId;
	delete(matchId: MatchId): boolean;
	get(matchId: MatchId): PongLoopId | undefined;
}
