import type { IPongClient } from "@domain/service/pong_client";
import { WebSocket } from "ws";

export class PongClient implements IPongClient {
	constructor(readonly client: WebSocket) {}

	isOpen(): boolean {
		return this.client.readyState === WebSocket.OPEN;
	}

	send(data: string): void {
		this.client.send(data);
	}
}
