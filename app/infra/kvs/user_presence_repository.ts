import { UserId } from "@domain/model/user";
import type { IUserPresenceRepository } from "@domain/repository/user_presence_repository";
import type { FastifyRedis } from "@fastify/redis";

export class UserPresenceRepository implements IUserPresenceRepository {
	private readonly onlineUsersKey = "users:online";
	private readonly userOnlinePrefix = "user:online:";
	private readonly defaultTTL = 300; // 5分

	constructor(private readonly redis: FastifyRedis) {}

	async setUserOnline(
		userId: UserId,
		ttl: number = this.defaultTTL,
	): Promise<void> {
		const userKey = this.getUserOnlineKey(userId);
		const pipeline = this.redis.pipeline();

		// ユーザーのオンライン状態を設定（TTL付き）
		pipeline.setex(userKey, ttl, "1");

		// オンラインユーザーセットに追加
		pipeline.sadd(this.onlineUsersKey, userId.value);

		// オンラインユーザーセットにもTTLを設定してクリーンアップ
		pipeline.expire(this.onlineUsersKey, ttl + 60); // 少し長めに設定

		await pipeline.exec();
	}

	async setUserOffline(userId: UserId): Promise<void> {
		const userKey = this.getUserOnlineKey(userId);
		const pipeline = this.redis.pipeline();

		// ユーザーのオンライン状態を削除
		pipeline.del(userKey);

		// オンラインユーザーセットから削除
		pipeline.srem(this.onlineUsersKey, userId.value);

		await pipeline.exec();
	}

	async isUserOnline(userId: UserId): Promise<boolean> {
		const userKey = this.getUserOnlineKey(userId);
		const result = await this.redis.exists(userKey);
		return result === 1;
	}

	async getUsersOnlineStatus(userIds: UserId[]): Promise<Map<string, boolean>> {
		if (userIds.length === 0) {
			return new Map();
		}

		const pipeline = this.redis.pipeline();
		const userKeys = userIds.map((id) => this.getUserOnlineKey(id));

		for (const key of userKeys) {
			pipeline.exists(key);
		}

		const results = await pipeline.exec();
		const statusMap = new Map<string, boolean>();

		if (results) {
			userIds.forEach((userId, index) => {
				const exists = results[index]?.[1] === 1;
				statusMap.set(userId.value, exists);
			});
		}

		return statusMap;
	}

	async getOnlineUsers(): Promise<UserId[]> {
		// まずセットから全てのオンラインユーザーを取得
		const userIds = await this.redis.smembers(this.onlineUsersKey);

		if (userIds.length === 0) {
			return [];
		}

		// 実際にオンライン状態のユーザーのみをフィルタリング
		const statusMap = await this.getUsersOnlineStatus(
			userIds.map((id) => new UserId(id)),
		);

		const onlineUserIds: UserId[] = [];
		const offlineUserIds: string[] = [];

		for (const [userIdStr, isOnline] of statusMap) {
			if (isOnline) {
				onlineUserIds.push(new UserId(userIdStr));
			} else {
				offlineUserIds.push(userIdStr);
			}
		}

		// オフラインユーザーをセットから削除（クリーンアップ）
		if (offlineUserIds.length > 0) {
			await this.redis.srem(this.onlineUsersKey, ...offlineUserIds);
		}

		return onlineUserIds;
	}

	async extendUserOnline(
		userId: UserId,
		ttl: number = this.defaultTTL,
	): Promise<void> {
		const userKey = this.getUserOnlineKey(userId);
		const exists = await this.redis.exists(userKey);

		if (exists) {
			// 既にオンラインの場合、TTLを延長
			await this.redis.expire(userKey, ttl);
		} else {
			// オンラインでない場合、オンライン状態にする
			await this.setUserOnline(userId, ttl);
		}
	}

	private getUserOnlineKey(userId: UserId): string {
		return `${this.userOnlinePrefix}${userId.value}`;
	}
}
