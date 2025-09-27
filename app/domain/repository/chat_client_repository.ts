import type { UserId } from "@domain/model";
import type { IChatClient } from "@domain/service/chat_client";

export interface IChatClientRepository {
	add(client: IChatClient): void;
	remove(client: IChatClient): void;
	findByUserId(userId: UserId): IChatClient | undefined;
}
