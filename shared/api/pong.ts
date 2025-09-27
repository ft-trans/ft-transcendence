export type PongGameEvent = "gameState";

export type PongGameStatePayload = {
	ball: { x: number; y: number; dx: number; dy: number };
	//   paddles: { player1: number; player2: number };
	//   score: { player1: number; player2: number };
};

export type PongGameStateResponse = {
	event: PongGameEvent;
	payload: PongGameStatePayload;
};

export const PongField = {
	width: 600,
	height: 400,
};
