import { NotFoundError } from "@domain/error";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface IRemoveFriendUsecase {
	userId: string;
	friendId: string;
}

export class RemoveFriendUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IRemoveFriendUsecase): Promise<void> {
		const userId = new UserId(input.userId);
		const friendId = new UserId(input.friendId);

		await this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();
			const friendship = await friendshipRepository.findByUserIds(
				userId.value,
				friendId.value,
			);

			if (!friendship || !friendship.isAccepted()) {
				throw new NotFoundError();
			}

			await friendshipRepository.delete(friendship);
		});
	}
}
