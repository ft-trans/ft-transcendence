import { MatchId, PongGame, PongPaddle } from "@domain/model";
import type { IRepository } from "@domain/repository";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const ball = PongGame.initialBall();
		const pongBallRepo = this.repo.newPongBallRepository();
		await pongBallRepo.set(matchId, ball);
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
		return matchId;
	}
}
