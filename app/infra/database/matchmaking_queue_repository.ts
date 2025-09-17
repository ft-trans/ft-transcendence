import type { IMatchmakingQueueRepository } from "@domain/repository/matchmaking_queue_repository";
import type { User } from "@domain/model/user";
import type { FastifyRedis } from "@fastify/redis";

type Options = {
  prefix?: string;                     // 例: "mm" → mm:queue / mm:inq / mm:user:<id>
  enqueueDirection?: "left" | "right"; // 既定: "right" (rpush + lpop で FIFO)
};

export class MatchmakingQueueRepository implements IMatchmakingQueueRepository {
  private readonly queueKey: string;
  private readonly inqKey: string;
  private readonly prefix: string;
  private readonly enqueueDir: "left" | "right";

  constructor(private readonly redis: FastifyRedis, opts?: Options) {
    this.prefix = opts?.prefix ?? "mm";
    this.queueKey = `${this.prefix}:queue`;
    this.inqKey = `${this.prefix}:inq`;
    this.enqueueDir = opts?.enqueueDirection ?? "right";
  }

  private userKey = (id: string) => `${this.prefix}:user:${id}`;

  // ---- キュー参加 ----------------------------------------------------------
  async add(user: User): Promise<void> {
    const id = user.id.value;

    // 既に待機中なら何もしない（sadd は追加件数を返す）
    const added = await this.redis.sadd(this.inqKey, id);
    if (added === 0) return;

    // 必要最小限の情報を保存（必要なら拡張）
    const stored = { id: { value: id } };
    await this.redis.set(this.userKey(id), JSON.stringify(stored));

    // FIFO: 末尾に積む（rpush）/ 取り出しは先頭（lpop）
    if (this.enqueueDir === "right") {
      await this.redis.rpush(this.queueKey, id);
    } else {
      await this.redis.lpush(this.queueKey, id);
    }
  }

  // ---- キュー離脱 ----------------------------------------------------------
  async remove(userId: string): Promise<void> {
    const removed = await this.redis.srem(this.inqKey, userId);
    if (removed > 0) {
      // キュー中のすべての該当要素を削除（count=0 は全削除）
      await this.redis.lrem(this.queueKey, 0, userId);
    }
    await this.redis.del(this.userKey(userId));
  }

  // ---- 2人ポップ（マッチ成立判定） -----------------------------------------
  async pop(): Promise<[User, User] | undefined> {
    // pipeline は型がややこしいので使わず、順に2回取り出す
    const id1 = (await this.redis.lpop(this.queueKey)) as string | null;
    const id2 = (await this.redis.lpop(this.queueKey)) as string | null;

    if (!id1 || !id2) {
      // 片方だけ取れたら末尾に戻す（best-effort）
      if (id1 && !id2) {
        await this.redis.rpush(this.queueKey, id1);
      }
      return undefined;
    }

    // in-queue セットから除去（ioredis は可変長OK）
    await this.redis.srem(this.inqKey, id1, id2);

    // ユーザ情報取得（mget は可変長）
    const [u1Json, u2Json] = (await this.redis.mget(
      this.userKey(id1),
      this.userKey(id2),
    )) as (string | null)[];

    if (!u1Json || !u2Json) {
      // 情報欠落 → キュー & inq に戻す
      await this.redis.rpush(this.queueKey, id1);
      await this.redis.rpush(this.queueKey, id2);
      await this.redis.sadd(this.inqKey, id1, id2);
      return undefined;
    }

    // 後片付け（キャッシュ削除）
    await this.redis.del(this.userKey(id1), this.userKey(id2));

    // 復元（必要なら UserId/User コンストラクタで厳密化）
    const u1 = JSON.parse(u1Json) as User;
    const u2 = JSON.parse(u2Json) as User;

    return [u1, u2];
  }
}
