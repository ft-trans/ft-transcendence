import { ErrNotFound } from "@domain/error";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

export class CancelFriendRequestUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(params: {
		requesterId: string;
		receiverId: string;
	}): Promise<void> {
		const { requesterId, receiverId } = params;
		const _requesterUserId = new UserId(requesterId);
		const _receiverUserId = new UserId(receiverId);

		return this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();

			// 友達申請が存在するかチェック
			const friendship = await friendshipRepository.findByUserIds(
				requesterId,
				receiverId,
			);

			if (!friendship) {
				throw new ErrNotFound();
			}

			// pending状態の友達申請のみ取り消し可能
			if (friendship.status !== "pending") {
				throw new ErrNotFound();
			}

			// 自分が送信した友達申請のみ取り消し可能
			if (friendship.requesterId.value !== requesterId) {
				throw new ErrNotFound();
			}

			// 友達申請を削除
			await friendshipRepository.delete(friendship);
		});
	}
}
