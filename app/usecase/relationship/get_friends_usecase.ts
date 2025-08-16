import { NotFoundError } from "@domain/error";
import type { User } from "@domain/model/user";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

export class GetFriendsUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(userIdValue: string): Promise<User[]> {
		const userId = new UserId(userIdValue);

		return this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();
			const friendshipRepository = repo.newFriendshipRepository();

			const user = await userRepository.findById(userId);
			if (!user) {
				throw new NotFoundError();
			}

			return friendshipRepository.findFriendsByUserId(userId.value);
		});
	}
}
