import { isValid } from "ulid";
import { ErrBadRequest } from "../error";
import { ValueObject } from "./value_object";

export const pongFieldSize = {
	width: 600,
	height: 400,
};

export const pongPaddleSize = {
	width: 15,
	height: 50,
};

export const pongPaddleDy = 20;

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
export type PongPaddleDirection = "up" | "down";

export class PongPaddle {
	readonly x: number;
	readonly y: number;

	readonly width = pongPaddleSize.width;
	readonly height = pongPaddleSize.height;

	constructor({ x, y }: { x: number; y: number }) {
		this.x = x;
		this.y = y;
	}

	move(direction: PongPaddleDirection): PongPaddle {
		const newY =
			direction === "up" ? this.y - pongPaddleDy : this.y + pongPaddleDy;
		if (newY < 0) {
			return new PongPaddle({ x: this.x, y: 0 });
		}
		if (newY > pongFieldSize.height - this.height) {
			return new PongPaddle({
				x: this.x,
				y: pongFieldSize.height - this.height,
			});
		}
		return new PongPaddle({ x: this.x, y: newY });
	}

	// Collision is detected using two lines consisting of the following four points:
	// line1: ball_p1 to ball_p2
	//   ball_p1: (ball.x, ball.y)
	//   ball_p2: (ball.x + ball.dx, ball.y + ball.dy)
	// line2: paddle_p1 to paddle_p2
	//   paddle_p1: (paddle.x, paddle.y),
	//   paddle_p2: (paddle.x, paddle.y + height)
	//
	// Note:
	// To simplify collision detection for the top and bottom surfaces of the paddle,
	// collision is detected using vertical lines in the paddle.
	detectCollision(ball: PongBall, rallyTime: number): PongBall | undefined {
		let lines = [0, 0.25, 0.5, 0.75, 1];
		if (ball.dx < 0) {
			// if the ball is moving left, check right edge first
			lines = lines.reverse();
		}
		const ballNextX = ball.x + ball.dx;
		const ballNextY = ball.y + ball.dy;
		for (const line of lines) {
			const px = this.x + line * this.width;
			if (
				(ball.x <= px && px <= ballNextX) ||
				(ballNextX <= px && px <= ball.x)
			) {
				const t = (px - ball.x) / (ballNextX - ball.x);
				const intersectY = ball.y + t * (ballNextY - ball.y);
				if (this.y <= intersectY && intersectY <= this.y + this.height) {
					const centerY = this.y + this.height / 2.0;
					const centerRate = (intersectY - centerY) / (this.height / 2.0);
					return this.collidedBall(ball, centerRate, rallyTime);
				}
			}
		}

		return undefined;
	}

	collidedBall(
		ball: PongBall,
		centerRate: number,
		rallyTime: number,
	): PongBall {
		let newDx = -ball.dx;
		let newDy = ball.dy;
		if (Math.abs(centerRate) < 0.3) {
			newDx = Math.sign(newDx) * 2;
			newDy = newDy * 0.2;
		} else if (Math.abs(centerRate) < 0.6) {
			newDx = Math.sign(newDx) * 10;
		} else if (Math.abs(centerRate) < 0.8) {
			newDx = Math.sign(newDx) * 3;
			newDy = Math.sign(centerRate) * 5;
		} else {
			newDx = Math.sign(newDx) * 3;
			newDy = Math.sign(centerRate) * 8;
		}
		newDx *= 1 + rallyTime * 0.15;
		newDy *= 1 + rallyTime * 0.1;

		// avoid to trap the ball in the paddle
		let newX = ball.x;
		if (
			this.x <= ball.x &&
			ball.x <= this.x + this.width &&
			this.y <= ball.y &&
			ball.y <= this.y + this.height
		) {
			if (ball.dx < 0) {
				newX = this.x + this.width + 1;
			} else {
				newX = this.x - 1;
			}
		}

		return new PongBall({
			x: newX,
			y: ball.y,
			dx: newDx,
			dy: newDy,
		});
	}

	static createInitial(player: PongPlayer): PongPaddle {
		const x =
			player === "player1"
				? 40
				: pongFieldSize.width - pongPaddleSize.width - 40;
		const y = (pongFieldSize.height - pongPaddleSize.height) / 2;
		return new PongPaddle({ x, y });
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

	next(): PongBall {
		return new PongBall({
			x: this.x + this.dx,
			y: this.y + this.dy,
			dx: this.dx,
			dy: this.dy,
		});
	}
}

export class PongField {
	readonly width = pongFieldSize.width;
	readonly height = pongFieldSize.height;

	detectCollision(ball: PongBall): PongBall | undefined {
		const nextBall = ball.next();
		if (nextBall.y < 0) {
			return new PongBall({
				x: nextBall.x,
				y: -nextBall.y,
				dx: nextBall.dx,
				dy: -nextBall.dy,
			});
		} else if (this.height < nextBall.y) {
			return new PongBall({
				x: nextBall.x,
				y: this.height - (nextBall.y - this.height),
				dx: nextBall.dx,
				dy: -nextBall.dy,
			});
		}
		return undefined;
	}

	scorePoint(ball: PongBall, player: PongPlayer): boolean {
		const nextBall = ball.next();
		if (player === "player1") {
			return nextBall.x < 0;
		} else {
			return this.width < nextBall.x;
		}
	}
}

export class PongMatchState {
	// readonly gameState: "waiting" | "playing" | "ended"
	// readonly score: { player1: number; player2: number },
	readonly rallyTime: number = 0;

	constructor({ rallyTime = 0 }: { rallyTime: number }) {
		this.rallyTime = rallyTime;
	}

	initRallyTime(): PongMatchState {
		return new PongMatchState({ rallyTime: 0 });
	}
	incrementRally(): PongMatchState {
		return new PongMatchState({ rallyTime: this.rallyTime + 1 });
	}

	static init(): PongMatchState {
		return new PongMatchState({ rallyTime: 0 });
	}
}

export class PongGame {
	readonly field = new PongField();

	constructor(
		readonly ball: PongBall | undefined,
		readonly paddles: {
			player1: PongPaddle | undefined;
			player2: PongPaddle | undefined;
		},
		readonly state: PongMatchState,
	) {}

	calculateFrame(): PongGame {
		if (!this.ball || !this.paddles.player1 || !this.paddles.player2) {
			return this;
		}

		const newBallP1 = this.paddles.player1.detectCollision(
			this.ball,
			this.state.rallyTime,
		);
		if (newBallP1) {
			return new PongGame(newBallP1, this.paddles, this.state.incrementRally());
		}
		const newBallP2 = this.paddles.player2.detectCollision(
			this.ball,
			this.state.rallyTime,
		);
		if (newBallP2) {
			return new PongGame(newBallP2, this.paddles, this.state.incrementRally());
		}
		const newBallField = this.field.detectCollision(this.ball);
		if (newBallField) {
			return new PongGame(newBallField, this.paddles, this.state);
		}

		if (this.field.scorePoint(this.ball, "player1")) {
			// TODO スコア計算
			return new PongGame(undefined, this.paddles, this.state);
		}
		if (this.field.scorePoint(this.ball, "player2")) {
			// TODO スコア計算
			return new PongGame(undefined, this.paddles, this.state);
		}

		return new PongGame(this.ball.next(), this.paddles, this.state);
	}

	static initialBall(): PongBall {
		const x = pongFieldSize.width / 2;
		const y = pongFieldSize.height * Math.random();
		// TODO 点を取られた方に向かって出るようにする。
		// TODO 最初はplayer1に向かうようにする
		const dx = -3;
		const dy = 8 * (0.5 - Math.random());
		return new PongBall({ x, y, dx, dy });
	}
}
