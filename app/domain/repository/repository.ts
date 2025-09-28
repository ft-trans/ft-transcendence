import type { IDirectMessageRepository } from "./direct_message_repository";
import type { IFriendshipRepository } from "./friendship_repository";
import type { IPongBallRepository } from "./pong_ball_repository";
import type { IPongClientRepository } from "./pong_client_repository";
import type { IPongLoopRepository } from "./pong_loop_repository";
import type { ISessionRepository } from "./session_repository";
import type { IUserRepository } from "./user_repository";
import type { IMatchRepository } from "./match_repository";

export interface IRepository {
	// database repositories
	newUserRepository(): IUserRepository;
	newFriendshipRepository(): IFriendshipRepository;
	newDirectMessageRepository(): IDirectMessageRepository;
	newSessionRepository(): ISessionRepository;

	// KVS repositories
	newPongBallRepository(): IPongBallRepository;

	// in-memory repositories
	newPongClientRepository(): IPongClientRepository;
	newPongLoopRepository(): IPongLoopRepository;

	newMatchRepository(): IMatchRepository;
}
