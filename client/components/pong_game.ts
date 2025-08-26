import type { PongGameState } from "@shared/api/pong";

export class PongGame {
	private readonly canvas: HTMLCanvasElement;
	private readonly context: CanvasRenderingContext2D;
	readonly width = 600;
	readonly height = 400;

	constructor() {
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		const ctx = this.canvas.getContext("2d");
		if (!ctx) {
			throw new Error("Failed to get 2D context");
		}
		this.context = ctx;
	}

	appendTo(parent: HTMLElement) {
		parent.appendChild(this.canvas);
		this.drawField();
	}

	draw(gameState: PongGameState) {
		this.drawField();
		this.drawBall(gameState.payload.ball.x, gameState.payload.ball.y);
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

	private drawBall(x: number, y: number) {
		this.context.fillStyle = "white";
		this.context.beginPath();
		this.context.arc(x, y, 5, 0, Math.PI * 2);
		this.context.fill();
	}
}
