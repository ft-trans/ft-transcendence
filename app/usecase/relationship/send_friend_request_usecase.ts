import { ErrBadRequest, ErrForbidden, ErrNotFound } from "@domain/error";
import { Friendship } from "@domain/model/friendship";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface ISendFriendRequestUsecase {
	requesterId: string;
	receiverId: string;
}

export class SendFriendRequestUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: ISendFriendRequestUsecase): Promise<void> {
		const requesterId = new UserId(input.requesterId);
		const receiverId = new UserId(input.receiverId);

		if (requesterId.equals(receiverId)) {
			throw new ErrBadRequest({
				userMessage: "Cannot send a friend request to oneself.",
			});
		}

		await this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();
			const friendshipRepository = repo.newFriendshipRepository();

			const [requester, receiver] = await Promise.all([
				userRepository.findById(requesterId),
				userRepository.findById(receiverId),
			]);

			if (!requester || !receiver) {
				throw new ErrNotFound();
			}

			const existingFriendship = await friendshipRepository.findByUserIds(
				requesterId.value,
				receiverId.value,
			);

			if (existingFriendship) {
				if (existingFriendship.status === "blocked") {
					throw new ErrForbidden();
				}
				throw new ErrBadRequest({
					userMessage: "Friendship already exists or is pending.",
				});
			}

			const friendship = Friendship.create(requester, receiver);
			await friendshipRepository.save(friendship);
		});
	}
}
