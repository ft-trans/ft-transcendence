import type { IDirectMessageRepository } from "./direct_message_repository";
import type { IFriendshipRepository } from "./friendship_repository";
import type { IPongBallRepository } from "./pong_ball_repository";
import type { IPongClientRepository } from "./pong_client_repository";
import type { IPongLoopRepository } from "./pong_loop_repository";
import type { IUserRepository } from "./user_repository";

export interface IRepository {
	newUserRepository(): IUserRepository;
	newFriendshipRepository(): IFriendshipRepository;
	newDirectMessageRepository(): IDirectMessageRepository;
}

export interface IKVSRepository {
	newPongBallRepository(): IPongBallRepository;
}

export interface IInMemoryRepository {
	newPongClientRepository(): IPongClientRepository;
	newPongLoopRepository(): IPongLoopRepository;
}
