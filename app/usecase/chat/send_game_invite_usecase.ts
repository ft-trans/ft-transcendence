import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { UserId } from "@domain/model";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import { MESSAGE_TYPES } from "@shared/api/chat";

type ISendGameInviteUsecase = {
	senderId: string;
	receiverId: string;
};

export class SendGameInviteUsecase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly chatClientRepository: IChatClientRepository,
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
			throw new ErrNotFound();
		}

		const receiverClient = this.chatClientRepository.findByUserId(
			new UserId(input.receiverId),
		);

		if (receiverClient) {
			receiverClient.send({
				type: MESSAGE_TYPES.GAME_INVITE,
				payload: {
					senderId: sender.id.value,
					senderName: sender.username.value,
				},
			});
		}
	}
}
