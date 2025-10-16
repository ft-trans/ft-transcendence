import type { Friendship } from "@domain/model/friendship";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

export class GetFriendRequestsUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(userIdValue: string): Promise<Friendship[]> {
		const userId = new UserId(userIdValue);

		return this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();

			// 自分が受信した友達申請を取得
			return await friendshipRepository.findPendingRequestsByReceiverId(
				userId.value,
			);
		});
	}
}
