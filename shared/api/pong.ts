export type PongGameEvent = "gameState";

export type PongGameStatePayload = {
	field: { width: number; height: number };
	ball: { x: number; y: number; dx: number; dy: number };
	paddles: {
		player1: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		player2: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	};
	//   score: { player1: number; player2: number };
};

export type PongGameStateResponse = {
	event: PongGameEvent;
	payload: PongGameStatePayload;
};

export const pongCommandStart = "pong:start";
export const pongCommandPaddle1Up = "pong:paddle1:up";
export const pongCommandPaddle1Down = "pong:paddle1:down";
export const pongCommandPaddle2Up = "pong:paddle2:up";
export const pongCommandPaddle2Down = "pong:paddle2:down";

export type PongCommand =
	| typeof pongCommandStart
	| typeof pongCommandPaddle1Up
	| typeof pongCommandPaddle1Down
	| typeof pongCommandPaddle2Up
	| typeof pongCommandPaddle2Down;

export const PongField = {
	width: 600,
	height: 400,
};
