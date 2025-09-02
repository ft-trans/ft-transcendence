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

export class IntervalId extends ValueObject<number, "IntervalId"> {
	protected validate(value: number): void {
		if (!Number.isInteger(value) || value < 0) {
			throw new ErrBadRequest({
				details: {
					intervalId: "インターバルIDは非負の整数である必要があります",
				},
			});
		}
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

export class PongGameState {
	constructor(
		readonly ball: PongBall,
		// readonly paddles: { player1: Paddle; player2: Paddle },
		// readonly score: { player1: number; player2: number },
	) {}
}
