import { User, UserEmail, UserId } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { Client } from "./prisma";

export class UserRepository implements IUserRepository {
	constructor(private readonly client: Client) {}

	async create(user: User): Promise<User> {
		const createdUser = await this.client.user.create({
			data: {
				id: user.id.value,
				email: user.email.value,
				passwordDigest: user.passwordDigest,
			},
		});
		return User.reconstruct(
			new UserId(createdUser.id),
			new UserEmail(createdUser.email),
			createdUser.passwordDigest,
		);
	}

	async update(user: User): Promise<User> {
		const updatedUser = await this.client.user.update({
			where: {
				id: user.id.value,
			},
			data: {
				email: user.email.value,
				passwordDigest: user.passwordDigest,
			},
		});
		return User.reconstruct(
			new UserId(updatedUser.id),
			new UserEmail(updatedUser.email),
			updatedUser.passwordDigest,
		);
	}

	async delete(id: UserId): Promise<User> {
		const deletedUser = await this.client.user.delete({
			where: {
				id: id.value,
			},
		});
		return User.reconstruct(
			new UserId(deletedUser.id),
			new UserEmail(deletedUser.email),
			deletedUser.passwordDigest,
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
		return User.reconstruct(
			new UserId(user.id),
			new UserEmail(user.email),
			user.passwordDigest,
		);
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
		return User.reconstruct(
			new UserId(user.id),
			new UserEmail(user.email),
			user.passwordDigest,
		);
	}
}
