import type { User, UserEmail, UserId, Username } from "../model";

export interface IUserRepository {
	create(user: User): Promise<User>;
	update(user: User): Promise<User>;
	delete(id: UserId): Promise<User>;
	findById(id: UserId): Promise<User | undefined>;
	findByEmail(email: UserEmail): Promise<User | undefined>;
	findByUsername(username: Username): Promise<User | undefined>;
	searchByUsername(
		searchQuery: string,
		options?: { excludeUserId?: string; limit?: number },
	): Promise<User[]>;
	findMany(options?: {
		excludeUserId?: string;
		limit?: number;
	}): Promise<User[]>;
	findByIds(ids: UserId[]): Promise<User[]>;
}
