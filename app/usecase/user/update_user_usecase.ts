import { BadRequestError, NotFoundError } from "@domain/error";
import { User, UserEmail, UserId } from "@domain/model";
import { UserService } from "@domain/service";
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
				throw new NotFoundError();
			}

			const email = new UserEmail(input.email);
			const updatedUser = User.reconstruct(currentUser.id, email);

			if (currentUser.equals(updatedUser)) {
				return currentUser;
			}

			const userService = new UserService(userRepo);
			if (
				currentUser.email.value !== email.value &&
				(await userService.exists(updatedUser))
			) {
				throw new BadRequestError({
					userMessage: "メールアドレスはすでに使用されています",
				});
			}

			return await userRepo.update(updatedUser);
		});
		return user;
	}
}
