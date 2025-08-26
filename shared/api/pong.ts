export type PongGameEvent = "gameState";

export type PongGameState = {
	event: PongGameEvent;
	payload: {
		ball: { x: number; y: number; vx: number; vy: number };
		//   paddles: { player1_y: number; player2_y: number };
		//   score: { player1: number; player2: number };
	};
};
