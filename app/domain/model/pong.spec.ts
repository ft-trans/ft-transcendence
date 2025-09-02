import { ErrBadRequest } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { MatchId, PongBall } from "./pong";

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

describe("PongBall", () => {
	it("should create a ball with valid values", () => {
		const ball = new PongBall({ x: 1, y: 2, dx: 3, dy: 4 });

		expect(ball).toBeInstanceOf(PongBall);
		expect(ball.x).toBe(1);
		expect(ball.y).toBe(2);
		expect(ball.dx).toBe(3);
		expect(ball.dy).toBe(4);
	});
});
