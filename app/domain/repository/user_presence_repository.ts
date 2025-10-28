import type { UserId } from "@domain/model/user";

export interface IUserPresenceRepository {
	setUserOnline(userId: UserId, ttl?: number): Promise<void>;
	setUserOffline(userId: UserId): Promise<void>;
	isUserOnline(userId: UserId): Promise<boolean>;
	getUsersOnlineStatus(userIds: UserId[]): Promise<Map<string, boolean>>;
	getOnlineUsers(): Promise<UserId[]>;
	extendUserOnline(userId: UserId, ttl?: number): Promise<void>;
}
