import { MatchId, PongPaddle } from "@domain/model";
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
		await pongPaddleRepo.set(
			matchId,
			"player1",
			PongPaddle.createInitial("player1"),
		);
		await pongPaddleRepo.set(
			matchId,
			"player2",
			PongPaddle.createInitial("player2"),
		);

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
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongPaddleRepo,
			pongClientRepo,
		);
		pongLoopService.start(matchId, () => pongGameEngineService.processFrame());
	}
}
