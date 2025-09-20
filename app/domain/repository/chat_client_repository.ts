import type { UserId } from "@domain/model";
import type { ChatClient } from "@domain/service/chat_client";

export const ChatClientRepository = Symbol("ChatClientRepository");

export interface ChatClientRepository {
	add(client: ChatClient): void;
	remove(client: ChatClient): void;
	findByUserId(userId: UserId): ChatClient | undefined;
}
