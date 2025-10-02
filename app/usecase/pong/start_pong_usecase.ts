import { MatchId, PongGame, PongMatchState } from "@domain/model";
import type { IRepository } from "@domain/repository";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepo.get(matchId);
		const newState = state ? state.initRallyTime() : PongMatchState.init();
		pongMatchStateRepo.set(matchId, newState);

		const ball = PongGame.initialBall(newState);
		const pongBallRepo = this.repo.newPongBallRepository();
		await pongBallRepo.set(matchId, ball);
		return matchId;
	}
}
