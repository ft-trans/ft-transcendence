import type { PongGameStateResponse } from "@shared/api/pong";
import { type MatchId, PongGame } from "../model/pong";
import type { IPongBallRepository } from "../repository/pong_ball_repository";
import type { IPongClientRepository } from "../repository/pong_client_repository";

export class PongGameEngineService {
	constructor(
		private readonly matchId: MatchId,
		private readonly pongBallRepo: IPongBallRepository,
		private readonly pongClientRepo: IPongClientRepository,
	) {}

	// Processing one frame
	// this function is called in setInterval
	async processFrame() {
		const ball = await this.pongBallRepo.get(this.matchId);
		if (!ball) {
			return;
		}
		const pongGame = new PongGame(ball);
		const newPongGame = pongGame.calculateFrame();

		this.pongClientRepo.get(this.matchId)?.forEach((client) => {
			if (!client.isOpen()) {
				return;
			}
			client.send(JSON.stringify(this.toResponse(newPongGame)));
		});

		await this.pongBallRepo.set(this.matchId, newPongGame.ball);
	}

	private toResponse(pongGame: PongGame): PongGameStateResponse {
		return {
			event: "gameState",
			payload: {
				ball: pongGame.ball,
				// paddles: this.paddles,
				// score: this.score,
			},
		};
	}
}
