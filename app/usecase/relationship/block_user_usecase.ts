import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { Friendship } from "@domain/model/friendship";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

type IBlockUserUsecase = {
	blockerId: string;
	blockedId: string;
};

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
				// requester/receiverの向きがblocker/blockedと一致しない場合は既存を削除して新規作成
				if (
					!friendship.requesterId.equals(blockerId) ||
					!friendship.receiverId.equals(blockedId)
				) {
					await friendshipRepository.delete(friendship);
					friendship = Friendship.create(blocker, blocked);
				}
				if (friendship.isBlocked()) {
					return;
				}
				friendship.block();
			} else {
				friendship = Friendship.create(blocker, blocked);
				friendship.block();
			}

			await friendshipRepository.save(friendship);
		});
	}
}
