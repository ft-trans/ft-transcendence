import type { IKVSRepository, IPongBallRepository } from "@domain/repository";
import type { FastifyRedis } from "@fastify/redis";
import { PongBallRepository } from "./pong_ball_repository";

export type Client = FastifyRedis;

export class KVSRepository implements IKVSRepository {
	constructor(private readonly client: Client) {}

	newPongBallRepository(): IPongBallRepository {
		return new PongBallRepository(this.client);
	}
}
