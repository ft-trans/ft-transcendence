import { MatchId, type PongClient } from "@domain/model";
import type { IInMemoryRepository, IKVSRepository } from "@domain/repository";
import { PongBehaviourService } from "@domain/service/pong_behaviour_service";

export type JoinPongUsecaseInput = {
	matchId: string;
	client: PongClient;
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
		if (pongLoopRepo.get(matchId)) {
			return;
		}

		const pongBallRepo = this.kvsRepo.newPongBallRepository();
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongBehaviourService = new PongBehaviourService(
			matchId,
			pongBallRepo,
			pongClientRepo,
		);
		pongLoopRepo.start(matchId, () => pongBehaviourService.processFrame());
	}
}
