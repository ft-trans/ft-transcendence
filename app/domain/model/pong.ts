import { isValid } from "ulid";
import { ErrBadRequest } from "../error";
import { ValueObject } from "./value_object";

const pongFieldSize = {
	width: 600,
	height: 400,
};

const pongPaddleSize = {
	width: 10,
	height: 50,
};

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

export type PongPlayer = "player1" | "player2";

export class PongPaddle {
	readonly x: number;
	readonly y: number;
	readonly player: PongPlayer;
	readonly width = pongPaddleSize.width;
	readonly height = pongPaddleSize.height;

	constructor({ x, y, player }: { x: number; y: number; player: PongPlayer }) {
		this.x = x;
		this.y = y;
		this.player = player;
	}

	static createInitial(player: PongPlayer): PongPaddle {
		const x =
			player === "player1"
				? 40
				: pongFieldSize.width - pongPaddleSize.width - 40;
		const y = (pongFieldSize.height - pongPaddleSize.height) / 2;
		return new PongPaddle({ x, y, player });
	}
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

export class PongField {
	readonly width = pongFieldSize.width;
	readonly height = pongFieldSize.height;
}

export class PongGame {
	readonly field = new PongField();

	constructor(
		readonly ball: PongBall,
		readonly paddles: { player1: PongPaddle; player2: PongPaddle },
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
		} else if (this.field.width < newX) {
			newDx *= -1;
			newX = this.field.width - (newX - this.field.width);
		}
		if (newY < 0) {
			newDy *= -1;
			newY *= -1;
		} else if (this.field.height < newY) {
			newDy *= -1;
			newY = this.field.height - (newY - this.field.height);
		}

		const newBall = new PongBall({ x: newX, y: newY, dx: newDx, dy: newDy });
		return new PongGame(newBall, this.paddles);
	}

	static initialBall(): PongBall {
		const x = pongFieldSize.width / 2;
		const y = pongFieldSize.height * Math.random();
		const dx = 20 * (0.5 - Math.random());
		const dy = 20 * (0.5 - Math.random());
		return new PongBall({ x, y, dx, dy });
	}
}
