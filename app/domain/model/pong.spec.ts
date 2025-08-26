import { ErrBadRequest } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { Ball, MatchId } from "./pong";

describe("MatchId", () => {
	it("should create a MatchId instance with a valid ULID", () => {
		const validUlid = ulid();
		expect(() => new MatchId(validUlid)).not.toThrow();
	});

	it("should throw a BadRequestError for an invalid ULID", () => {
		const invalidUlid = "invalid-ulid";
		expect(() => new MatchId(invalidUlid)).toThrowError(
			new ErrBadRequest({
				details: {
					matchId: "マッチIDは有効なULIDである必要があります",
				},
			}),
		);
	});
});

describe("Ball", () => {
	it("should create a ball with valid values", () => {
		const ball = new Ball(0, 0, 1, 1);

		expect(ball).toBeInstanceOf(Ball);
		expect(ball.x).toBe(0);
		expect(ball.y).toBe(0);
		expect(ball.vx).toBe(1);
		expect(ball.vy).toBe(1);
	});
});
