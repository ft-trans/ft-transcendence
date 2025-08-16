import type { Friendship } from "../model/friendship";
import type { User } from "../model/user";

export interface IFriendshipRepository {
	save(friendship: Friendship): Promise<Friendship>;
	findByUserIds(userId1: string, userId2: string): Promise<Friendship | null>;
	findFriendsByUserId(userId: string): Promise<User[]>;
	findPendingRequestsByReceiverId(userId: string): Promise<Friendship[]>;
	delete(friendship: Friendship): Promise<void>;
}
