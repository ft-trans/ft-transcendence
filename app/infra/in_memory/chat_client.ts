import type { IChatClient } from "@domain/service/chat_client";
import type { ServerMessage } from "@shared/api/chat";
import type WebSocket from "ws";

export class InMemoryChatClient implements IChatClient {
	private userId: string | undefined;

	constructor(private readonly client: WebSocket) {}

	send(message: ServerMessage): void {
		this.client.send(JSON.stringify(message));
	}

	setUserId(userId: string): void {
		this.userId = userId;
	}

	getUserId(): string | undefined {
		return this.userId;
	}
}
