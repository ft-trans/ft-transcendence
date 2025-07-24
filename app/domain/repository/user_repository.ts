import type { User, UserEmail, UserId } from "../model";

export interface IUserRepository {
	create(user: User): Promise<User>;
	findById(id: UserId): Promise<User | undefined>;
	findByEmail(email: UserEmail): Promise<User | undefined>;
}
