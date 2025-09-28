import type { User, UserId } from "../model/user";

export interface IMatchmakingQueueRepository {
	add(user: User): Promise<void>;
	remove(userId: string): Promise<void>;
	pop(): Promise<[UserId, UserId] | undefined>;
}