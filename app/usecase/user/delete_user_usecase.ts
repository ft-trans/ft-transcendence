import { ErrNotFound } from "@domain/error";
import { type User, UserId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type DeleteUserUsecaseInput = {
	id: string;
};

export class DeleteUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: DeleteUserUsecaseInput): Promise<User> {
		const user = await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const userId = new UserId(input.id);
			const currentUser = await userRepo.findById(userId);
			if (!currentUser) {
				throw new ErrNotFound();
			}

			return await userRepo.delete(userId);
		});
		return user;
	}
}
