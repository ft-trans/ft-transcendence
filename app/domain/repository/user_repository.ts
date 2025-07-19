import type { User, UserId } from "../model";

export interface IUserRepository {
	findById(id: UserId): Promise<User | undefined>;
}
