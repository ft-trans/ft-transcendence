import type { PongGameStateResponse } from "@shared/api/pong";

export class PongGame {
	private readonly canvas: HTMLCanvasElement;
	private readonly context: CanvasRenderingContext2D;
	private readonly scoreFont: string;

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
		this.scoreFont = "180px 'Jersey 10', monospace";
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
		if (gameState.payload.ball !== undefined) {
			this.drawBall(gameState.payload.ball);
		}
		this.drawPaddle(gameState.payload.paddles.player1);
		this.drawPaddle(gameState.payload.paddles.player2);
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
		x,
		y,
		width,
		height,
	}: {
		x: number;
		y: number;
		width: number;
		height: number;
	}) {
		this.context.fillStyle = "white";
		this.context.fillRect(x, y, width, height);
	}

	private drawScore(score: { player1: number; player2: number }) {
		this.context.fillStyle = "#ccc";
		this.context.font = this.scoreFont;
		this.context.textAlign = "center";
		this.context.fillText(`${score.player1}`, this.canvas.width / 4, 120);
		this.context.fillText(`${score.player2}`, (this.canvas.width / 4) * 3, 120);
	}
}
