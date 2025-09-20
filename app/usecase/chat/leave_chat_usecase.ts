import type { ChatClientRepository } from "@domain/repository/chat_client_repository";
import type { ChatClient } from "@domain/service/chat_client";

export class LeaveChatUsecase {
	constructor(private readonly chatClientRepository: ChatClientRepository) {}

	execute(client: ChatClient): void {
		this.chatClientRepository.remove(client);
	}
}
