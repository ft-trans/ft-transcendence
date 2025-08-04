import { BadRequestError, InternalServerError } from "@domain/error";
import { User, UserEmail } from "@domain/model";
import { UserService } from "@domain/service";
import type { ITransaction } from "@usecase/transaction";

export type RegisterUserUsecaseInput = {
	email: string;
};

export class RegisterUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: RegisterUserUsecaseInput): Promise<User> {
		const email = new UserEmail(input.email);
		const newUser = User.create(email);

		const user = await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const userService = new UserService(userRepo);

			if (await userService.exists(newUser)) {
				throw new BadRequestError({
					userMessage: "メールアドレスはすでに使用されています",
				});
			}

			const user = await userRepo.create(newUser);
			if (!user) {
				throw new InternalServerError();
			}
			return user;
		});
		return user;
	}
}
