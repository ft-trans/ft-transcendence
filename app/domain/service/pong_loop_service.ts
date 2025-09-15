import { type MatchId, PongLoopId } from "@domain/model";
import type { IPongLoopRepository } from "@domain/repository";

// Frames Per Second
const FPS = 60;

export class PongLoopService {
	constructor(private readonly pongLoopRepo: IPongLoopRepository) {}

	start(matchId: MatchId, processFrame: () => void): PongLoopId | undefined {
		const loopId = setInterval(processFrame, 1000 / FPS);
		const pongLoopId = new PongLoopId(loopId);
		this.pongLoopRepo.set(matchId, pongLoopId);
		return pongLoopId;
	}

	stop(matchId: MatchId): PongLoopId | undefined {
		const pongLoop = this.pongLoopRepo.get(matchId);
		if (pongLoop) {
			clearInterval(pongLoop.value);
			this.pongLoopRepo.delete(matchId);
		}
		return pongLoop;
	}

	exists(matchId: MatchId): boolean {
		return this.pongLoopRepo.get(matchId) !== undefined;
	}
}
