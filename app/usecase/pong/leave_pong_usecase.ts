import { MatchId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";
import type { IPongClient } from "@domain/service/pong_client";

export type LeavePongUsecaseInput = {
	matchId: string;
	client: IPongClient;
};

export class LeavePongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: LeavePongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const pongClientRepo = this.repo.newPongClientRepository();
		const clients = pongClientRepo.delete(matchId, input.client);
		if (!clients) {
			const pongLoopRepo = this.repo.newPongLoopRepository();
			const pongLoopService = new PongLoopService(pongLoopRepo);
			pongLoopService.stop(matchId);

			const pongBallRepo = this.repo.newPongBallRepository();
			const pongPaddleRepo = this.repo.newPongPaddleRepository();
			await pongBallRepo.delete(matchId);
			await pongPaddleRepo.delete(matchId, "player1");
			await pongPaddleRepo.delete(matchId, "player2");
		}

		return matchId;
	}
}
