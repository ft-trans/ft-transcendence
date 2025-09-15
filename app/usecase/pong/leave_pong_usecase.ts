import { MatchId } from "@domain/model";
import type { IInMemoryRepository, IKVSRepository } from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";

export type LeavePongUsecaseInput = {
	matchId: string;
	client: IPongClient;
};

export class LeavePongUsecase {
	constructor(
		private readonly repo: IInMemoryRepository,
		private readonly kvsRepo: IKVSRepository,
	) {}

	async execute(input: LeavePongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongLoopRepo = this.repo.newPongLoopRepository();
		const pongBallRepo = this.kvsRepo.newPongBallRepository();

		const clients = pongClientRepo.delete(matchId, input.client);
		if (!clients) {
			pongLoopRepo.stop(matchId);
			await pongBallRepo.delete(matchId);
		}

		return matchId;
	}
}
