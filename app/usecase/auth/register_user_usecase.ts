import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { Password, User, UserEmail, Username } from "@domain/model";
import { UserService } from "@domain/service";
import type { ITransaction } from "@usecase/transaction";

export type RegisterUserUsecaseInput = {
	email: string;
	username: string;
	password: string;
};

export class RegisterUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: RegisterUserUsecaseInput): Promise<User> {
		const email = new UserEmail(input.email);
		const username = new Username(input.username);
		const password = new Password(input.password);
		const passwordDigest = password.hash();
		const newUser = User.create(email, username, undefined, passwordDigest);

		const user = await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const userService = new UserService(userRepo);

			if (await userService.exists(newUser)) {
				throw new ErrBadRequest({
					userMessage: "メールアドレスはすでに使用されています",
				});
			}

			// ユーザー名の重複チェック
			const existingUserByUsername = await userRepo.findByUsername(username);
			if (existingUserByUsername) {
				throw new ErrBadRequest({
					userMessage: "ユーザー名はすでに使用されています",
				});
			}

			const user = await userRepo.create(newUser);
			if (!user) {
				throw new ErrInternalServer();
			}
			return user;
		});
		return user;
	}
}
