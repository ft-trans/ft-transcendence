import { ErrNotFound } from "@domain/error";
import { type User, Username } from "@domain/model";
import type { IRepository } from "@domain/repository";

export class FindUserByUsernameUsecase {
	constructor(private readonly repo: IRepository) {}

	async exec(usernameStr: string): Promise<User> {
		const username = new Username(usernameStr);
		const user = await this.repo.newUserRepository().findByUsername(username);
		if (!user) {
			throw new ErrNotFound();
		}
		return user;
	}
}
