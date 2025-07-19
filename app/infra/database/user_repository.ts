import { User, UserEmail, UserId } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { PrismaClient } from "./generated";

export class UserRepository implements IUserRepository {
	constructor(private readonly client: PrismaClient) {}

	async findById(id: UserId): Promise<User | undefined> {
		const user = await this.client.user.findUnique({
			where: {
				id: id.value,
			},
		});
		if (!user) {
			return undefined;
		}
		return User.reconstruct(new UserId(user.id), new UserEmail(user.email));
	}
}
