import { MatchId, PongGame } from "@domain/model";
import type { IKVSRepository } from "@domain/repository";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IKVSRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const ball = PongGame.initialBall();
		const pongBallRepo = this.repo.newPongBallRepository();
		await pongBallRepo.set(matchId, ball);
		return matchId;
	}
}
