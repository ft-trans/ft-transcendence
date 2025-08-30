import type { User } from "../model/user";

export interface IMatchmakingQueueRepository {
	add(user: User): Promise<void>;
	remove(userId: string): Promise<void>;
	pop(): Promise<[User, User] | undefined>;
}
