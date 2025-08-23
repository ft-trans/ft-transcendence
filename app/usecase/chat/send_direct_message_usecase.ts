<<<<<<< HEAD
import { ErrBadRequest, ErrForbidden, ErrNotFound } from "@domain/error";
=======
import { BadRequestError, ForbiddenError, NotFoundError } from "@domain/error";
>>>>>>> 81e95bd62da8aa82a9fc1f55cc9c1fe4f9c38f2a
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
<<<<<<< HEAD
			throw new ErrBadRequest({
=======
			throw new BadRequestError({
>>>>>>> 81e95bd62da8aa82a9fc1f55cc9c1fe4f9c38f2a
				userMessage: "Cannot send a message to oneself.",
			});
		}

		if (!input.content?.trim()) {
<<<<<<< HEAD
			throw new ErrBadRequest({
=======
			throw new BadRequestError({
>>>>>>> 81e95bd62da8aa82a9fc1f55cc9c1fe4f9c38f2a
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
<<<<<<< HEAD
				throw new ErrNotFound();
=======
				throw new NotFoundError();
>>>>>>> 81e95bd62da8aa82a9fc1f55cc9c1fe4f9c38f2a
			}

			const friendshipRepo = repo.newFriendshipRepository();
			const block = await friendshipRepo.findByUserIds(
				senderId.value,
				receiverId.value,
			);
			if (block?.status === "blocked") {
<<<<<<< HEAD
				throw new ErrForbidden();
=======
				throw new ForbiddenError();
>>>>>>> 81e95bd62da8aa82a9fc1f55cc9c1fe4f9c38f2a
			}

			const message = DirectMessage.create(sender, receiver, input.content);
			return messageRepository.save(message);
		});
	}
}
