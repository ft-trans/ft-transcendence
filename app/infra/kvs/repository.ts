import type { IBallRepository, IKVSRepository } from "@domain/repository";
import type { FastifyRedis } from "@fastify/redis";
import { BallRepository } from "./pong_repository";

export type Client = FastifyRedis;

export class KVSRepository implements IKVSRepository {
	constructor(private readonly client: Client) {}

	newBallRepository(): IBallRepository {
		return new BallRepository(this.client);
	}
}
