import { User, UserEmail, UserId } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { Client } from "./repository";

export class UserRepository implements IUserRepository {
	constructor(private readonly client: Client) {}

	async create(user: User): Promise<User> {
		const createdUser = await this.client.user.create({
			data: {
				id: user.id.value,
				email: user.email.value,
			},
		});
		return User.reconstruct(
			new UserId(createdUser.id),
			new UserEmail(createdUser.email),
		);
	}

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

	async findByEmail(email: UserEmail): Promise<User | undefined> {
		const user = await this.client.user.findUnique({
			where: {
				email: email.value,
			},
		});
		if (!user) {
			return undefined;
		}
		return User.reconstruct(new UserId(user.id), new UserEmail(user.email));
	}
}
