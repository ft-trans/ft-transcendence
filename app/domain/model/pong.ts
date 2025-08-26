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

	static reconstruct(data: { x: number; y: number; vx: number; vy: number }) {
		return new Ball(data.x, data.y, data.vx, data.vy);
	}
}
