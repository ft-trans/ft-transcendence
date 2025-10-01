import { MatchId, PongMatchState, PongPaddle } from "@domain/model";
import type { IRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";
import type { IPongClient } from "@domain/service/pong_client";
import { PongGameEngineService } from "@domain/service/pong_game_engine_service";

export type JoinPongUsecaseInput = {
	matchId: string;
	client: IPongClient;
};

export class JoinPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: JoinPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);

		this.repo.newPongClientRepository().add(matchId, input.client);

		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const paddle1 = await pongPaddleRepo.get(matchId, "player1");
		if (!paddle1) {
			await pongPaddleRepo.set(
				matchId,
				"player1",
				PongPaddle.createInitial("player1"),
			);
		}
		const paddle2 = await pongPaddleRepo.get(matchId, "player2");
		if (!paddle2) {
			await pongPaddleRepo.set(
				matchId,
				"player2",
				PongPaddle.createInitial("player2"),
			);
		}

		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepo.get(matchId);
		if (!state) {
			pongMatchStateRepo.set(matchId, PongMatchState.init());
		}

		this.startLoop(matchId);
		return matchId;
	}

	private startLoop(matchId: MatchId): void {
		const pongLoopRepo = this.repo.newPongLoopRepository();
		const pongLoopService = new PongLoopService(pongLoopRepo);
		if (pongLoopService.exists(matchId)) {
			return;
		}

		const pongBallRepo = this.repo.newPongBallRepository();
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongPaddleRepo,
			pongClientRepo,
			pongMatchStateRepo,
		);
		pongLoopService.start(matchId, () => pongGameEngineService.processFrame());
	}
}
