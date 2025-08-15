import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { User, UserEmail, UserId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type UpdateUserUsecaseInput = {
	id: string;
	email: string;
};

export class UpdateUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: UpdateUserUsecaseInput): Promise<User> {
		const user = await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const userId = new UserId(input.id);
			const currentUser = await userRepo.findById(userId);
			if (!currentUser) {
				throw new ErrNotFound();
			}

			const email = new UserEmail(input.email);
			const updatedUser = User.reconstruct(currentUser.id, email);

			if (!currentUser.isModified(updatedUser)) {
				return currentUser;
			}

			const existingUserByEmail = await userRepo.findByEmail(email);
			if (
				existingUserByEmail &&
				!existingUserByEmail.id.equals(currentUser.id)
			) {
				throw new ErrBadRequest({
					details: {
						userEmail: "メールアドレスは既に使用されています",
					},
				});
			}

			return await userRepo.update(updatedUser);
		});
		return user;
	}
}
