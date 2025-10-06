import {
	type PongGamePhase,
	type PongGameStateResponse,
	type PongPlayerState,
	pongMaxScore,
} from "@shared/api/pong";
import { navigateTo } from "../router";

export class PongGame {
	private readonly canvas: HTMLCanvasElement;
	private readonly context: CanvasRenderingContext2D;

	constructor({ width, height } = { width: 600, height: 400 }) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		const ctx = this.canvas.getContext("2d");
		if (!ctx) {
			// TODO ユーザーに通知
			throw new Error("Failed to get 2D context");
		}
		this.context = ctx;
	}

	appendTo(parent: HTMLElement) {
		parent.appendChild(this.canvas);
		this.drawField();
	}

	draw(gameState: PongGameStateResponse) {
		this.canvas.width = gameState.payload.field.width;
		this.canvas.height = gameState.payload.field.height;

		this.drawField();
		this.drawScore(gameState.payload.state.score);
		if (this.gameIsOver(gameState.payload.state.phase)) {
			return;
		}
		this.drawCountDown(new Date(gameState.payload.state.startedAt));
		if (gameState.payload.ball !== undefined) {
			this.drawBall(gameState.payload.ball);
		}
		this.drawPaddle({
			paddle: gameState.payload.paddles.player1,
			state: gameState.payload.state.playerStates.player1,
		});
		this.drawPaddle({
			paddle: gameState.payload.paddles.player2,
			state: gameState.payload.state.playerStates.player2,
		});
	}

	private gameIsOver(phase: PongGamePhase): boolean {
		if (phase !== "ended") {
			return false;
		}

		this.context.font = "80px 'Jersey 10', monospace";
		this.context.textAlign = "center";
		this.context.fillStyle = "#5f5";
		this.context.fillText(
			"The Game is Over",
			this.canvas.width / 2,
			this.canvas.height / 2 + 20,
		);

		this.context.font = "20px 'sans-serif'";
		this.context.textAlign = "center";
		this.context.fillStyle = "#fff";
		this.context.fillText(
			"クリックして対戦履歴を表示する",
			this.canvas.width / 2,
			this.canvas.height / 2 + 60,
		);
		this.canvas.style.cursor = "pointer";
		this.canvas.addEventListener("click", () => {
			// TODO 対戦履歴画面へ遷移
			navigateTo("/");
		});

		return true;
	}

	private drawField() {
		// field
		this.context.fillStyle = "black";
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		// center line
		this.context.strokeStyle = "white";
		this.context.beginPath();
		this.context.moveTo(this.canvas.width / 2, 0);
		this.context.lineTo(this.canvas.width / 2, this.canvas.height);
		this.context.setLineDash([5, 5]);
		this.context.stroke();
	}

	private drawBall({ x, y }: { x: number; y: number }) {
		this.context.fillStyle = "white";
		this.context.beginPath();
		this.context.arc(x, y, 8, 0, Math.PI * 2);
		this.context.fill();
	}

	private drawPaddle({
		paddle: { x, y, width, height },
		state,
	}: {
		paddle: { x: number; y: number; width: number; height: number };
		state: PongPlayerState;
	}) {
		if (state === "waiting") {
			this.context.fillStyle = "gray";
		} else if (state === "left") {
			this.context.fillStyle = "yellow";
		} else if (state === "playing") {
			this.context.fillStyle = "white";
		} else {
			this.context.fillStyle = "red";
		}
		this.context.fillRect(x, y, width, height);
	}

	private drawScore(score: { player1: number; player2: number }) {
		this.context.font = "180px 'Jersey 10', monospace";
		this.context.textAlign = "center";

		this.context.fillStyle = PongGame.scoreColor(score.player1);
		this.context.fillText(`${score.player1}`, this.canvas.width / 4, 120);

		this.context.fillStyle = PongGame.scoreColor(score.player2);
		this.context.fillText(`${score.player2}`, (this.canvas.width / 4) * 3, 120);
	}

	private static scoreColor(score: number): string {
		if (score >= pongMaxScore) {
			return "#5f5";
		}
		if (score + 1 >= pongMaxScore) {
			return "#ff5";
		}
		return "#ccc";
	}

	private drawCountDown(startedAt: Date) {
		const now = new Date();
		const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
		const count = 10 - elapsed;
		if (count <= 0) {
			return;
		}

		this.context.font = "200px 'Jersey 10', monospace";
		this.context.textAlign = "center";
		this.context.fillStyle = "#5f5";
		this.context.fillText(
			`${count}`,
			this.canvas.width / 2,
			this.canvas.height / 2 + 50,
		);
	}
}
