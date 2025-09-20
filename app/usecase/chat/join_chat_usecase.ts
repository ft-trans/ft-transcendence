import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { IChatClient } from "@domain/service/chat_client";

export class JoinChatUsecase {
	constructor(private readonly chatClientRepository: IChatClientRepository) {}

	execute(client: IChatClient): void {
		this.chatClientRepository.add(client);
	}
}
