import type { UserId } from "@domain/model";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { IChatClient } from "@domain/service/chat_client";

export class InMemoryChatClientRepository implements IChatClientRepository {
	private readonly clients = new Map<string, IChatClient>();

	add(client: IChatClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.set(userId, client);
		}
	}

	remove(client: IChatClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.delete(userId);
		}
	}

	findByUserId(userId: UserId): IChatClient | undefined {
		return this.clients.get(userId.value);
	}
}
