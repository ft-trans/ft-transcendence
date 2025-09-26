import type { MatchId, PongMatchState } from "@domain/model";

export interface IPongMatchStateRepository {
	set(matchId: MatchId, pongMatchState: PongMatchState): PongMatchState;
	delete(matchId: MatchId): boolean;
	get(matchId: MatchId): PongMatchState | undefined;
}
