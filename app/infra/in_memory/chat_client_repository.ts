import type { UserId } from "@domain/model";
import type { ChatClientRepository } from "@domain/repository/chat_client_repository";
import type { ChatClient } from "@domain/service/chat_client";

export class InMemoryChatClientRepository implements ChatClientRepository {
	private readonly clients = new Map<string, ChatClient>();

	add(client: ChatClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.set(userId, client);
		}
	}

	remove(client: ChatClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.delete(userId);
		}
	}

	findByUserId(userId: UserId): ChatClient | undefined {
		return this.clients.get(userId.value);
	}
}
