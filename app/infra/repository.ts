import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongPaddleRepository,
	IRepository,
	IUserRepository,
} from "@domain/repository";
import type { FastifyRedis } from "@fastify/redis";
import { DirectMessageRepository } from "./database/direct_message_repository";
import { FriendshipRepository } from "./database/friendship_repository";
import type { Prisma } from "./database/generated";
import { UserRepository } from "./database/user_repository";
import { PongClientRepository } from "./in_memory/pong_client_repository";
import { PongLoopRepository } from "./in_memory/pong_loop_repository";
import { PongBallRepository } from "./kvs/pong_ball_repository";
import { PongPaddleRepository } from "./kvs/pong_paddle_repository";

export type Client = Prisma.DefaultPrismaClient | Prisma.TransactionClient;
export type KvsClient = FastifyRedis;

export class Repository implements IRepository {
	constructor(
		private readonly client: Client,
		private readonly kvsClient: KvsClient,
	) {}

	// database repositories
	newUserRepository(): IUserRepository {
		return new UserRepository(this.client);
	}

	newFriendshipRepository(): IFriendshipRepository {
		return new FriendshipRepository(this.client);
	}

	newDirectMessageRepository(): IDirectMessageRepository {
		return new DirectMessageRepository(this.client);
	}

	// KVS repositories
	newPongBallRepository(): IPongBallRepository {
		return new PongBallRepository(this.kvsClient);
	}
	newPongPaddleRepository(): IPongPaddleRepository {
		return new PongPaddleRepository(this.kvsClient);
	}

	// in-memory repositories
	newPongClientRepository(): IPongClientRepository {
		return new PongClientRepository();
	}
	newPongLoopRepository(): IPongLoopRepository {
		return new PongLoopRepository();
	}
}
