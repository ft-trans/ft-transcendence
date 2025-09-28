import { type User, UserId } from "@domain/model/user";
import type { IMatchmakingQueueRepository } from "@domain/repository/matchmaking_queue_repository";
import type { FastifyRedis } from "@fastify/redis";

type Options = {
	prefix?: string;
	enqueueDirection?: "left" | "right";
};

export class MatchmakingQueueRepository implements IMatchmakingQueueRepository {
	private readonly queueKey: string;
	private readonly inqKey: string;
	private readonly prefix: string;
	private readonly enqueueDir: "left" | "right";

	constructor(
		private readonly redis: FastifyRedis,
		opts?: Options,
	) {
		this.prefix = opts?.prefix ?? "mm";
		this.queueKey = `${this.prefix}:queue`;
		this.inqKey = `${this.prefix}:inq`;
		this.enqueueDir = opts?.enqueueDirection ?? "right";
	}

	async add(user: User): Promise<void> {
		const id = user.id.value;
		try {
			const added = await this.redis.sadd(this.inqKey, id);
			if (added === 0) {
				return;
			}

			if (this.enqueueDir === "right") {
				await this.redis.rpush(this.queueKey, id);
			} else {
				await this.redis.lpush(this.queueKey, id);
			}
		} catch (error) {
			console.error(`[QueueRepo ADD] FATAL ERROR for UserID: ${id}`, error);
			throw error;
		}
	}

	async remove(userId: string): Promise<void> {
		const removed = await this.redis.srem(this.inqKey, userId);
		if (removed > 0) {
			await this.redis.lrem(this.queueKey, 0, userId);
		}
	}

	async pop(): Promise<[UserId, UserId] | undefined> {
		try {
			const length = await this.redis.llen(this.queueKey);
			if (length < 2) {
				return undefined;
			}

			const id1 = await this.redis.lpop(this.queueKey);
			const id2 = await this.redis.lpop(this.queueKey);

			if (!id1 || !id2) {
				if (id1) await this.redis.lpush(this.queueKey, id1);
				if (id2) await this.redis.lpush(this.queueKey, id2);
				return undefined;
			}

			await this.redis.srem(this.inqKey, id1, id2);

			return [new UserId(id1), new UserId(id2)];
		} catch (error) {
			console.error("[QueueRepo POP] FATAL ERROR during pop operation", error);
			throw error;
		}
	}
}
