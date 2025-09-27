import type { MatchId, PongMatchState } from "@domain/model";
import type { IPongMatchStateRepository } from "@domain/repository";

export class PongMatchStateRepository implements IPongMatchStateRepository {
	private static readonly states = new Map<string, PongMatchState>();

	set(matchId: MatchId, pongMatchState: PongMatchState): PongMatchState {
		PongMatchStateRepository.states.set(matchId.value, pongMatchState);
		return pongMatchState;
	}
	delete(matchId: MatchId): boolean {
		return PongMatchStateRepository.states.delete(matchId.value);
	}
	get(matchId: MatchId): PongMatchState | undefined {
		return PongMatchStateRepository.states.get(matchId.value);
	}
}
