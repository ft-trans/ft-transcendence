import type { MatchId } from "@domain/model";
import type { IPongClient } from "@domain/service/pong_client";

export interface IPongClientRepository {
	get(matchId: MatchId): Set<IPongClient> | undefined;
	add(matchId: MatchId, pongClient: IPongClient): Set<IPongClient>;
	closeAndDelete(
		matchId: MatchId,
		pongClient: IPongClient,
	): Set<IPongClient> | undefined;
	closeAndDeleteAll(matchId: MatchId): void;
}
