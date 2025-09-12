import { type MatchId, PongLoopId } from "@domain/model";
import type { IPongLoopRepository } from "@domain/repository";

export class PongLoopRepository implements IPongLoopRepository {
	// Objects cannot be used as Map keys, so string keys are used instead.
	private static readonly loops = new Map<string, PongLoopId>();

	start(matchId: MatchId, processFrame: () => void): PongLoopId | undefined {
		const loopId = setInterval(processFrame, 1000 / 60);
		const pongLoopId = new PongLoopId(loopId);
		PongLoopRepository.loops.set(matchId.value, pongLoopId);
		return pongLoopId;
	}

	stop(matchId: MatchId): PongLoopId | undefined {
		const pongLoop = PongLoopRepository.loops.get(matchId.value);
		if (pongLoop) {
			clearInterval(pongLoop.value);
			PongLoopRepository.loops.delete(matchId.value);
		}
		return pongLoop;
	}

	get(matchId: MatchId): PongLoopId | undefined {
		return PongLoopRepository.loops.get(matchId.value);
	}
}
