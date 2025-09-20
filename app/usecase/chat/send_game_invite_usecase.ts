import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { UserId } from "@domain/model";
import type { ChatClientRepository } from "@domain/repository/chat_client_repository";
import type { UserRepository } from "@domain/repository/user_repository";

type ISendGameInviteUsecase = {
	senderId: string;
	receiverId: string;
};

export class SendGameInviteUsecase {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly chatClientRepository: ChatClientRepository,
	) {}

	async execute(input: ISendGameInviteUsecase): Promise<void> {
		if (input.senderId === input.receiverId) {
			throw new ErrBadRequest({
				userMessage: "自分自身にゲーム招待を送ることはできません。",
			});
		}

		const sender = await this.userRepository.findById(
			new UserId(input.senderId),
		);
		if (!sender) {
			throw new ErrNotFound({ userMessage: "送信者が見つかりません。" });
		}

		const receiverClient = this.chatClientRepository.findByUserId(
			new UserId(input.receiverId),
		);

		if (receiverClient) {
			receiverClient.send({
				type: "gameInvite",
				payload: {
					senderId: sender.id.value,
					senderEmail: sender.email.value,
				},
			});
		}
	}
}
