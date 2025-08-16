import { NotFoundError } from "@domain/error";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface IUnblockUserUsecase {
	blockerId: string;
	blockedId: string;
}

export class UnblockUserUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IUnblockUserUsecase): Promise<void> {
		const blockerId = new UserId(input.blockerId);
		const blockedId = new UserId(input.blockedId);

		await this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();
			const friendship = await friendshipRepository.findByUserIds(
				blockerId.value,
				blockedId.value,
			);

			// Only the blocker can unblock, and status must be 'blocked'
			if (
				!friendship ||
				friendship.status !== "blocked" ||
				!friendship.requesterId.equals(blockerId)
			) {
				throw new NotFoundError();
			}

			// Unblocking removes the relationship entirely
			await friendshipRepository.delete(friendship);
		});
	}
}
