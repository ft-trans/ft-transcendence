export type PongGameEvent = "gameState";

export type PongGamePhase =
	| "waiting"
	| "serv_player1"
	| "serv_player2"
	| "ended";

export type PongPlayerState = "waiting" | "playing" | "left";

export const pongMaxScore = 5;

export type PongGameStatePayload = {
	field: { width: number; height: number };
	ball: { x: number; y: number; dx: number; dy: number } | undefined;
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
	state: {
		rallyTime: number;
		score: { player1: number; player2: number };
		phase: PongGamePhase;
		playerStates: { player1: PongPlayerState; player2: PongPlayerState };
	};
};

export type PongGameStateResponse = {
	event: PongGameEvent;
	payload: PongGameStatePayload;
};

export const PONG_COMMAND = {
	START: "pong:start",
	PADDLE1_UP: "pong:paddle1:up",
	PADDLE1_DOWN: "pong:paddle1:down",
	PADDLE2_UP: "pong:paddle2:up",
	PADDLE2_DOWN: "pong:paddle2:down",
} as const;

export type PongCommand =
	| typeof PONG_COMMAND.START
	| typeof PONG_COMMAND.PADDLE1_UP
	| typeof PONG_COMMAND.PADDLE1_DOWN
	| typeof PONG_COMMAND.PADDLE2_UP
	| typeof PONG_COMMAND.PADDLE2_DOWN;
