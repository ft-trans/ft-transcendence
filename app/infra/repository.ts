import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongMatchStateRepository,
	IPongPaddleRepository,
	IRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import { DirectMessageRepository } from "./database/direct_message_repository";
import { FriendshipRepository } from "./database/friendship_repository";
import { MatchRepository } from "./database/match_repository";
import type { Client } from "./database/prisma";
import { SessionRepository } from "./database/session_repository";
import { UserRepository } from "./database/user_repository";
import { PongClientRepository } from "./in_memory/pong_client_repository";
import { PongLoopRepository } from "./in_memory/pong_loop_repository";
import { PongMatchStateRepository } from "./in_memory/pong_match_state_repository";
import type { KvsClient } from "./kvs/client";
import { PongBallRepository } from "./kvs/pong_ball_repository";
import { PongPaddleRepository } from "./kvs/pong_paddle_repository";

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
	newPongMatchStateRepository(): IPongMatchStateRepository {
		return new PongMatchStateRepository();
	}
	newMatchRepository(): IMatchRepository {
		return new MatchRepository(this.client);
	}
}
