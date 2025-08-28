import { Ball, MatchId, PongGameState } from "@domain/model";
import type { IKVSRepository } from "@domain/repository";
import { PongField } from "@shared/api/pong";

export type CalcPongStateUsecaseInput = {
	matchId: string;
};

export class CalcPongStateUsecase {
	constructor(private readonly repo: IKVSRepository) {}

	async execute(input: CalcPongStateUsecaseInput): Promise<PongGameState> {
		const matchId = new MatchId(input.matchId);

		const ball = await this.repo.newBallRepository().get(matchId);

		if (!ball) {
			return new PongGameState(
				new Ball(PongField.width / 2, PongField.height / 2, 0, 0),
			);
		}

		const newBall = this.calculateNewBallPosition(ball);
		await this.repo.newBallRepository().set(matchId, newBall);

		return new PongGameState(newBall);
	}

	private calculateNewBallPosition(ball: Ball): Ball {
		let newX = ball.x + ball.vx;
		let newY = ball.y + ball.vy;
		let newVx = ball.vx;
		let newVy = ball.vy;

		if (newX < 0) {
			newVx *= -1;
			newX *= -1;
		} else if (PongField.width < newX) {
			newVx *= -1;
			newX = PongField.width - (newX - PongField.width);
		}
		if (newY < 0) {
			newVy *= -1;
			newY *= -1;
		} else if (PongField.height < newY) {
			newVy *= -1;
			newY = PongField.height - (newY - PongField.height);
		}

		return new Ball(newX, newY, newVx, newVy);
	}
}
