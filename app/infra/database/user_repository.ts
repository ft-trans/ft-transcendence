import { User, UserEmail, UserId } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { Client } from "./repository";

export class UserRepository implements IUserRepository {
	constructor(private readonly client: Client) {}

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
