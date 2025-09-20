import type { UserId } from "@domain/model";
import type { ChatClient } from "@domain/service/chat_client";

export interface IChatClientRepository {
	add(client: ChatClient): void;
	remove(client: ChatClient): void;
	findByUserId(userId: UserId): ChatClient | undefined;
}
