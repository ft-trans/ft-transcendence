import type { User, UserId, UserName } from "../model";

export interface IUserRepository {
	create(user: User): Promise<User>;
	findById(id: UserId): Promise<User | undefined>;
	findByName(name: UserName): Promise<User | undefined>;
	update(user: User): Promise<User>;
	delete(id: UserId): Promise<void>;
}
