import { MatchId } from "@domain/model";
import type { IKVSRepository } from "@domain/repository";
import { PongBehaviourService } from "@domain/service/pong_behaviour_service";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IKVSRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const ball = PongBehaviourService.initialBall();
		const pongBallRepo = this.repo.newPongBallRepository();
		await pongBallRepo.set(matchId, ball);
		return matchId;
	}
}
