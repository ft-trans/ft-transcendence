import { PongField } from "@shared/api/pong";
import { isValid } from "ulid";
import { ErrBadRequest } from "../error";
import { ValueObject } from "./value_object";
export class MatchId extends ValueObject<string, "MatchId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					matchId: "マッチIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class PongLoopId extends ValueObject<NodeJS.Timeout, "PongLoop"> {
	protected validate(_value: NodeJS.Timeout): void {}
}

export class PongBall {
	readonly x: number;
	readonly y: number;
	readonly dx: number;
	readonly dy: number;

	constructor({
		x,
		y,
		dx,
		dy,
	}: { x: number; y: number; dx: number; dy: number }) {
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
	}
}

export class PongGame {
	constructor(
		readonly ball: PongBall,
		// readonly paddles: { player1: Paddle; player2: Paddle },
		// readonly score: { player1: number; player2: number },
	) {}

	calculateFrame(): PongGame {
		const ball = this.ball;
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

		const newBall = new PongBall({ x: newX, y: newY, dx: newDx, dy: newDy });
		return new PongGame(newBall);
	}

	static initialBall(): PongBall {
		const x = PongField.width / 2;
		const y = PongField.height * Math.random();
		const dx = 20 * (0.5 - Math.random());
		const dy = 20 * (0.5 - Math.random());
		return new PongBall({ x, y, dx, dy });
	}
}
