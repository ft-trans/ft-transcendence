import { UserId } from "@domain/model";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";

type ISendChatMessageUsecase = {
	senderId: string;
	receiverId: string;
	content: string;
};

export class SendChatMessageUsecase {
	constructor(
		private readonly sendDirectMessageUsecase: SendDirectMessageUsecase,
		private readonly chatClientRepository: IChatClientRepository,
	) {}

	async execute(input: ISendChatMessageUsecase): Promise<void> {
		const message = await this.sendDirectMessageUsecase.execute(input);

		const receiverClient = this.chatClientRepository.findByUserId(
			new UserId(input.receiverId),
		);

		if (receiverClient) {
			receiverClient.send({
				type: MESSAGE_TYPES.NEW_MESSAGE,
				payload: {
					senderId: message.sender.id.value,
					senderEmail: message.sender.email.value,
					content: message.content,
					timestamp: message.sentAt.toISOString(),
				},
			});
		}
	}
}
