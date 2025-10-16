import type { User } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

export class SearchUsersUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(params: {
		searchQuery?: string;
		excludeUserId?: string;
		limit?: number;
	}): Promise<User[]> {
		const { searchQuery, excludeUserId, limit = 50 } = params;

		return this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();

			if (searchQuery) {
				return await userRepository.searchByUsername(searchQuery, {
					excludeUserId,
					limit,
				});
			} else {
				return await userRepository.findMany({
					excludeUserId,
					limit,
				});
			}
		});
	}
}
