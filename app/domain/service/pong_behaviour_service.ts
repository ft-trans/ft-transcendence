import { PongField, type PongGameStateResponse } from "@shared/api/pong";
import { type MatchId, PongBall, PongGameState } from "../model/pong";
import type { IPongBallRepository } from "../repository/pong_ball_repository";
import type { IPongClientRepository } from "../repository/pong_client_repository";

export class PongBehaviourService {
	constructor(
		private readonly matchId: MatchId,
		private readonly pongBallRepo: IPongBallRepository,
		private readonly pongClientRepo: IPongClientRepository,
	) {}

	static initialBall(): PongBall {
		const x = PongField.width / 2;
		const y = PongField.height * Math.random();
		const dx = 20 * (0.5 - Math.random());
		const dy = 20 * (0.5 - Math.random());
		return new PongBall({ x, y, dx, dy });
	}

	// Processing one frame
	// this function is called in setInterval in PongLoopRepository
	async processFrame() {
		const ball = await this.pongBallRepo.get(this.matchId);
		if (!ball) {
			return;
		}
		const state = new PongGameState(ball);
		const newState = this.calculatePhysics(state);

		this.pongClientRepo.get(this.matchId)?.forEach((client) => {
			if (!client.isOpen()) {
				return;
			}
			client.send(JSON.stringify(this.toResponse(newState)));
		});

		await this.pongBallRepo.set(this.matchId, newState.ball);
	}

	private calculatePhysics(state: PongGameState): PongGameState {
		const ball = state.ball;
		let newX = ball.x + ball.dx;
		let newY = ball.y + ball.dy;
		let newDx = ball.dx;
		let newDy = ball.dy;

		if (newX < 0) {
			newDx *= -1;
			newX *= -1;
		} else if (PongField.width < newX) {
			newDx *= -1;
			newX = PongField.width - (newX - PongField.width);
		}
		if (newY < 0) {
			newDy *= -1;
			newY *= -1;
		} else if (PongField.height < newY) {
			newDy *= -1;
			newY = PongField.height - (newY - PongField.height);
		}

		const newBall = new PongBall({ x: newX, y: newY, dx: newDx, dy: newDy });
		return new PongGameState(newBall);
	}

	private toResponse(state: PongGameState): PongGameStateResponse {
		return {
			event: "gameState",
			payload: {
				ball: state.ball,
				// paddles: this.paddles,
				// score: this.score,
			},
		};
	}
}
