import { ErrBadRequest, ErrForbidden, ErrNotFound } from "@domain/error";
import { DirectMessage } from "@domain/model/direct_message";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface ISendDirectMessageUsecase {
	senderId: string;
	receiverId: string;
	content: string;
}

export class SendDirectMessageUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: ISendDirectMessageUsecase): Promise<DirectMessage> {
		const senderId = new UserId(input.senderId);
		const receiverId = new UserId(input.receiverId);

		if (senderId.equals(receiverId)) {
			throw new ErrBadRequest({
				userMessage: "Cannot send a message to oneself.",
			});
		}

		if (!input.content?.trim()) {
			throw new ErrBadRequest({
				userMessage: "Message content cannot be empty.",
			});
		}

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
			const block = await friendshipRepo.findByUserIds(
				senderId.value,
				receiverId.value,
			);
			if (block?.status === "blocked") {
				throw new ErrForbidden();
			}

			const message = DirectMessage.create(sender, receiver, input.content);
			return messageRepository.save(message);
		});
	}
}
