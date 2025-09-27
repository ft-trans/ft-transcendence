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
		if (state) {
			pongMatchStateRepo.set(matchId, state.initRallyTime());
		} else {
			pongMatchStateRepo.set(matchId, PongMatchState.init());
		}
		const ball = PongGame.initialBall();
		const pongBallRepo = this.repo.newPongBallRepository();
		await pongBallRepo.set(matchId, ball);
		return matchId;
	}
}
