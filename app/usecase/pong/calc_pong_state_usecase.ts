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
			// TODO ユーザーへの通知
			throw new Error("Ball not found");
		}

		const newBall = this.calculateNewBallPosition(ball);
		await this.repo.newBallRepository().set(matchId, newBall);

		return new PongGameState(newBall);
	}

	private calculateNewBallPosition(ball: Ball): Ball {
		let newX = ball.x + ball.dx;
		let newY = ball.y + ball.dy;
		let newDx = ball.dx;
		let newDy = ball.dy;

		if (newX < 0) {
			newDx *= -1;
			newX *= -1;
		} else if (PongField.width < newX) {
			newDx *= -1;
			newX = PongField.width - (newX - PongField.width);
		}
		if (newY < 0) {
			newDy *= -1;
			newY *= -1;
		} else if (PongField.height < newY) {
			newDy *= -1;
			newY = PongField.height - (newY - PongField.height);
		}

		return new Ball({ x: newX, y: newY, dx: newDx, dy: newDy });
	}
}
