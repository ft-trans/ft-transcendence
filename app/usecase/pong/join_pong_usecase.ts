import { MatchId } from "@domain/model";
import type { IInMemoryRepository, IKVSRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";
import type { IPongClient } from "@domain/service/pong_client";
import { PongGameEngineService } from "@domain/service/pong_game_engine_service";

export type JoinPongUsecaseInput = {
	matchId: string;
	client: IPongClient;
};

export class JoinPongUsecase {
	constructor(
		private readonly repo: IInMemoryRepository,
		private readonly kvsRepo: IKVSRepository,
	) {}

	async execute(input: JoinPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);

		this.repo.newPongClientRepository().add(matchId, input.client);
		this.startLoop(matchId);
		return matchId;
	}

	private startLoop(matchId: MatchId): void {
		const pongLoopRepo = this.repo.newPongLoopRepository();
		const pongLoopService = new PongLoopService(pongLoopRepo);
		if (pongLoopService.exists(matchId)) {
			return;
		}

		const pongBallRepo = this.kvsRepo.newPongBallRepository();
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongClientRepo,
		);
		pongLoopService.start(matchId, () => pongGameEngineService.processFrame());
	}
}
