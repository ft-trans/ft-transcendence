import { MatchId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";

import { PongGameEngineService } from "@domain/service/pong_game_engine_service";

export type StopPongUsecaseInput = {
	matchId: string;
	error: Error;
};

export class StopPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: StopPongUsecaseInput): Promise<void> {
		const matchId = new MatchId(input.matchId);
		this.stopPong(matchId, input.error);
	}

	private stopPong(matchId: MatchId, error: Error): void {
		const pongLoopRepo = this.repo.newPongLoopRepository();
		const pongLoopService = new PongLoopService(pongLoopRepo);
		const pongBallRepo = this.repo.newPongBallRepository();
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const matchRepo = this.repo.newMatchRepository();
		const matchHistoryRepo = this.repo.newMatchHistoryRepository();
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongPaddleRepo,
			pongClientRepo,
			pongMatchStateRepo,
			matchRepo,
			pongLoopService,
			matchHistoryRepo,
		);
		pongGameEngineService.handleError(error);
	}
}
