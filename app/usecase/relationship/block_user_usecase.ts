import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { Friendship } from "@domain/model/friendship";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface IBlockUserUsecase {
	blockerId: string;
	blockedId: string;
}

export class BlockUserUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IBlockUserUsecase): Promise<void> {
		const blockerId = new UserId(input.blockerId);
		const blockedId = new UserId(input.blockedId);

		if (blockerId.equals(blockedId)) {
			throw new ErrBadRequest({ userMessage: "Cannot block oneself." });
		}

		await this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();
			const friendshipRepository = repo.newFriendshipRepository();

			const [blocker, blocked] = await Promise.all([
				userRepository.findById(blockerId),
				userRepository.findById(blockedId),
			]);

			if (!blocker || !blocked) {
				throw new ErrNotFound();
			}

			let friendship = await friendshipRepository.findByUserIds(
				blockerId.value,
				blockedId.value,
			);

			if (friendship) {
				if (friendship.status === "blocked") {
					return; // Already blocked
				}
				friendship.status = "blocked";
			} else {
				// Create a new friendship with blocked status
				friendship = Friendship.create(blocker, blocked);
				friendship.status = "blocked";
			}

			await friendshipRepository.save(friendship);
		});
	}
}
