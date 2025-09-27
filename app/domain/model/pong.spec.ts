import { ErrBadRequest } from "@domain/error";
import { PongField } from "@shared/api/pong";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { MatchId, PongBall, PongGame } from "./pong";

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

describe("PongGame", () => {
	it("should calculate the next frame correctly", () => {
		const ball = new PongBall({ x: 50, y: 50, dx: 5, dy: 3 });
		const pongGame = new PongGame(ball);

		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(55);
		expect(newPongGame.ball.y).toBe(53);
		expect(newPongGame.ball.dx).toBe(5);
		expect(newPongGame.ball.dy).toBe(3);
	});

	it("should bounce off the left wall", () => {
		const ball = new PongBall({ x: 1, y: 50, dx: -5, dy: 2 });
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(4);
		expect(newPongGame.ball.y).toBe(52);
		expect(newPongGame.ball.dx).toBe(5);
		expect(newPongGame.ball.dy).toBe(2);
	});

	it("should bounce off the right wall", () => {
		const ball = new PongBall({ x: PongField.width - 1, y: 50, dx: 5, dy: 2 });
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(PongField.width - 4);
		expect(newPongGame.ball.y).toBe(52);
		expect(newPongGame.ball.dx).toBe(-5);
		expect(newPongGame.ball.dy).toBe(2);
	});

	it("should bounce off the top wall", () => {
		const ball = new PongBall({ x: 50, y: 1, dx: -5, dy: -5 });
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(45);
		expect(newPongGame.ball.y).toBe(4);
		expect(newPongGame.ball.dx).toBe(-5);
		expect(newPongGame.ball.dy).toBe(5);
	});

	it("should bounce off the bottom wall", () => {
		const ball = new PongBall({ x: 6, y: PongField.height - 1, dx: -5, dy: 5 });
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(1);
		expect(newPongGame.ball.y).toBe(PongField.height - 4);
		expect(newPongGame.ball.dx).toBe(-5);
		expect(newPongGame.ball.dy).toBe(-5);
	});

	it("should bounce off the corner(top-left)", () => {
		const ball = new PongBall({ x: 1, y: 1, dx: -5, dy: -5 });
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(4);
		expect(newPongGame.ball.y).toBe(4);
		expect(newPongGame.ball.dx).toBe(5);
		expect(newPongGame.ball.dy).toBe(5);
	});

	it("should bounce off the corner(bottom-right)", () => {
		const ball = new PongBall({
			x: PongField.width - 1,
			y: PongField.height - 1,
			dx: 5,
			dy: 5,
		});
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();
		expect(newPongGame.ball.x).toBe(PongField.width - 4);
		expect(newPongGame.ball.y).toBe(PongField.height - 4);
		expect(newPongGame.ball.dx).toBe(-5);
		expect(newPongGame.ball.dy).toBe(-5);
	});
});
