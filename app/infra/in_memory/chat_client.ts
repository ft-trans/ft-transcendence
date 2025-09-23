import type { IChatClient } from "@domain/service/chat_client";
import type { ServerMessage } from "@shared/api/chat";
import type WebSocket from "ws";

export class InMemoryChatClient implements IChatClient {
	private userId: string;

	constructor(
		private readonly client: WebSocket,
		userId: string,
	) {
		this.userId = userId;
	}

	send(message: ServerMessage): void {
		this.client.send(JSON.stringify(message));
	}

	getUserId(): string {
		return this.userId;
	}
}
