import type { MatchId, PongLoopId } from "@domain/model";
import type { IPongLoopRepository } from "@domain/repository";

export class PongLoopRepository implements IPongLoopRepository {
	// Objects cannot be used as Map keys, so string keys are used instead.
	private static readonly loops = new Map<string, PongLoopId>();

	set(matchId: MatchId, pongLoopId: PongLoopId): PongLoopId {
		PongLoopRepository.loops.set(matchId.value, pongLoopId);
		return pongLoopId;
	}

	delete(matchId: MatchId): boolean {
		return PongLoopRepository.loops.delete(matchId.value);
	}

	get(matchId: MatchId): PongLoopId | undefined {
		return PongLoopRepository.loops.get(matchId.value);
	}
}
