import type { PongGameStatePayload } from "@shared/api/pong";
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

export class Ball {
	constructor(
		readonly x: number,
		readonly y: number,
		readonly vx: number,
		readonly vy: number,
	) {}
}

export class PongGameState {
	constructor(
		readonly ball: Ball,
		// readonly paddles: { player1: Paddle; player2: Paddle },
		// readonly score: { player1: number; player2: number },
	) {}

	toPayload(): PongGameStatePayload {
		return {
			ball: this.ball,
			// paddles: this.paddles,
			// score: this.score,
		};
	}
}
