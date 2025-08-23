import { ErrForbidden, ErrNotFound } from "@domain/error";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface IRespondToFriendRequestUsecase {
	receiverId: string; // The user responding to the request
	requesterId: string; // The user who sent the request
	response: "accept" | "reject";
}

export class RespondToFriendRequestUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IRespondToFriendRequestUsecase): Promise<void> {
		const receiverId = new UserId(input.receiverId);
		const requesterId = new UserId(input.requesterId);

		await this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();
			const friendship = await friendshipRepository.findByUserIds(
				requesterId.value,
				receiverId.value,
			);

			if (!friendship) {
				throw new ErrNotFound();
			}

			// Ensure the request is pending and the correct user is responding
			if (
				friendship.status !== "pending" ||
				!friendship.receiverId.equals(receiverId)
			) {
				throw new ErrForbidden();
			}

			if (input.response === "accept") {
				friendship.accept();
				await friendshipRepository.save(friendship);
			} else {
				await friendshipRepository.delete(friendship);
			}
		});
	}
}
