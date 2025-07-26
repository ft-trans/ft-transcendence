import { NotFoundError } from "@domain/error";
import type { User, UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";

export class FindUserUsecase {
	constructor(private readonly repo: IRepository) {}

	async run(userId: UserId): Promise<User> {
		const user = await this.repo.newUserRepository().findById(userId);
		if (!user) {
			throw new NotFoundError();
		}
		return user;
	}
}
