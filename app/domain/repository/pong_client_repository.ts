import type { MatchId, PongClient } from "@domain/model";

export interface IPongClientRepository {
	get(matchId: MatchId): Set<PongClient> | undefined;
	add(matchId: MatchId, pongClient: PongClient): Set<PongClient>;
	delete(matchId: MatchId, pongClient: PongClient): Set<PongClient> | undefined;
}
