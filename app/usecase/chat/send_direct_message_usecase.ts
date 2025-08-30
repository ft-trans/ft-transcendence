import { ErrBadRequest, ErrForbidden, ErrNotFound } from "@domain/error";
import { DirectMessage } from "@domain/model/direct_message";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

type ISendDirectMessageUsecase = {
	senderId: string;
	receiverId: string;
	content: string;
};

export class SendDirectMessageUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: ISendDirectMessageUsecase): Promise<DirectMessage> {
		if (input.senderId === input.receiverId) {
			throw new ErrBadRequest({
				userMessage: "自分自身にメッセージ送信することはできません。",
			});
		}
		const senderId = new UserId(input.senderId);
		const receiverId = new UserId(input.receiverId);

		return this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();
			const messageRepository = repo.newDirectMessageRepository();

			const [sender, receiver] = await Promise.all([
				userRepository.findById(senderId),
				userRepository.findById(receiverId),
			]);

			if (!sender || !receiver) {
				throw new ErrNotFound();
			}

			const friendshipRepo = repo.newFriendshipRepository();
			const friendship = await friendshipRepo.findByUserIds(
				senderId.value,
				receiverId.value,
			);
			if (friendship) {
				if (friendship.isBlocked()) {
					throw new ErrForbidden();
				}
				throw new ErrBadRequest({
					userMessage: "すでに友達になっているか、友達リクエストが存在します。",
				});
			}

			const message = DirectMessage.create(sender, receiver, input.content);
			return messageRepository.save(message);
		});
	}
}
