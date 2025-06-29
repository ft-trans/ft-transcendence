import type { User, UserId, UserName } from "../../domain/model";
import type { IUserRepository } from "../../domain/repository";

export class InMemoryUserRepository implements IUserRepository {
	private users: Map<string, User> = new Map();

	async create(user: User): Promise<User> {
		if (this.users.has(user.id.value)) {
			throw new Error(`User with id ${user.id.value} already exists.`);
		}

		this.users.set(user.id.value, user);
		return user;
	}

	async findByName(name: UserName): Promise<User | undefined> {
		for (const user of this.users.values()) {
			if (user.name.value === name.value) {
				return user;
			}
		}
		return undefined;
	}

	async findById(id: UserId): Promise<User | undefined> {
		return this.users.get(id.value);
	}

	async update(user: User): Promise<User> {
		if (!this.users.has(user.id.value)) {
			throw new Error(`User with id ${user.id.value} not found.`);
		}

		this.users.set(user.id.value, user);
		return user;
	}

	async delete(id: UserId): Promise<void> {
		if (!this.users.has(id.value)) {
			throw new Error(`User with id ${id.value} not found.`);
		}

		this.users.delete(id.value);
	}
}
