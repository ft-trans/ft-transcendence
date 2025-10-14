import type { User } from "@domain/model/user";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

type IGetBlockedUsersUsecase = {
	blockerId: string;
};

export class GetBlockedUsersUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IGetBlockedUsersUsecase): Promise<User[]> {
		const blockerId = new UserId(input.blockerId);

		return await this.transaction.exec(async (repo) => {
			const friendshipRepository = repo.newFriendshipRepository();

			// Get all users blocked by the current user
			return await friendshipRepository.findBlockedUsersByBlockerId(blockerId.value);
		});
	}
}