import { ErrBadRequest, ErrNotFound } from "@domain/error";
import {
	Password,
	type User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
} from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type UpdateUserUsecaseInput = {
	id: string;
	email?: string;
	username?: string;
	avatar?: string;
	password?: string;
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

			const email = input.email
				? new UserEmail(input.email)
				: currentUser.email;
			const username = input.username
				? new Username(input.username)
				: currentUser.username;
			const avatar =
				input.avatar !== undefined
					? new UserAvatar(input.avatar)
					: currentUser.avatar;
			const passwordDigest =
				input.password !== undefined && input.password.length > 0
					? new Password(input.password).hash()
					: currentUser.passwordDigest;

			const updatedUser = currentUser.updateProfile(
				email,
				username,
				avatar,
				passwordDigest,
			);

			if (!currentUser.isModified(updatedUser)) {
				return currentUser;
			}

			// メールアドレスの重複チェック
			if (input.email) {
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
			}

			// ユーザー名の重複チェック
			if (input.username) {
				const existingUserByUsername = await userRepo.findByUsername(username);
				if (
					existingUserByUsername &&
					!existingUserByUsername.id.equals(currentUser.id)
				) {
					throw new ErrBadRequest({
						details: {
							username: "ユーザー名は既に使用されています",
						},
					});
				}
			}

			return await userRepo.update(updatedUser);
		});
		return user;
	}
}
