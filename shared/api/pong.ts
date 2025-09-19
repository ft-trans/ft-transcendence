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

export const PongField = {
	width: 600,
	height: 400,
};
