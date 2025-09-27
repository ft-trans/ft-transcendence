import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import { DirectMessageRepository } from "./database/direct_message_repository";
import { FriendshipRepository } from "./database/friendship_repository";
import type { Client } from "./database/prisma";
import { SessionRepository } from "./database/session_repository";
import { UserRepository } from "./database/user_repository";
import { PongClientRepository } from "./in_memory/pong_client_repository";
import { PongLoopRepository } from "./in_memory/pong_loop_repository";
import type { KvsClient } from "./kvs/client";
import { PongBallRepository } from "./kvs/pong_ball_repository";

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

	newSessionRepository(): ISessionRepository {
		return new SessionRepository(this.client);
	}

	// KVS repositories
	newPongBallRepository(): IPongBallRepository {
		return new PongBallRepository(this.kvsClient);
	}

	// in-memory repositories
	newPongClientRepository(): IPongClientRepository {
		return new PongClientRepository();
	}
	newPongLoopRepository(): IPongLoopRepository {
		return new PongLoopRepository();
	}
}
