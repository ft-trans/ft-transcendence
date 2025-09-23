import { User, UserEmail, UserId, Username, UserAvatar, UserStatusValue, UserStatus } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { Client } from "./prisma";

export class UserRepository implements IUserRepository {
	constructor(private readonly client: Client) {}

	async create(user: User): Promise<User> {
		const createdUser = await this.client.user.create({
			data: {
				id: user.id.value,
				email: user.email.value,
				username: user.username.value,
				avatar: user.avatar.value,
				status: user.status.value,
				passwordDigest: user.passwordDigest,
			},
		});
		return User.reconstruct(
			new UserId(createdUser.id),
			new UserEmail(createdUser.email),
			new Username(createdUser.username),
			new UserAvatar(createdUser.avatar),
			new UserStatusValue(createdUser.status as UserStatus),
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
				username: user.username.value,
				avatar: user.avatar.value,
				status: user.status.value,
				passwordDigest: user.passwordDigest,
			},
		});
		return User.reconstruct(
			new UserId(updatedUser.id),
			new UserEmail(updatedUser.email),
			new Username(updatedUser.username),
			new UserAvatar(updatedUser.avatar),
			new UserStatusValue(updatedUser.status as UserStatus),
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
			new Username(deletedUser.username),
			new UserAvatar(deletedUser.avatar),
			new UserStatusValue(deletedUser.status as UserStatus),
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
			new Username(user.username),
			new UserAvatar(user.avatar),
			new UserStatusValue(user.status as UserStatus),
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
			new Username(user.username),
			new UserAvatar(user.avatar),
			new UserStatusValue(user.status as UserStatus),
			user.passwordDigest,
		);
	}

	async findByUsername(username: Username): Promise<User | undefined> {
		const user = await this.client.user.findUnique({
			where: {
				username: username.value,
			},
		});
		if (!user) {
			return undefined;
		}
		return User.reconstruct(
			new UserId(user.id),
			new UserEmail(user.email),
			new Username(user.username),
			new UserAvatar(user.avatar),
			new UserStatusValue(user.status as UserStatus),
			user.passwordDigest,
		);
	}
}
