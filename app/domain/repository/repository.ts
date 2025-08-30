import type { IDirectMessageRepository } from "./direct_message_repository";
import type { IFriendshipRepository } from "./friendship_repository";
import type { IUserRepository } from "./user_repository";

export interface IRepository {
	newUserRepository(): IUserRepository;
	newFriendshipRepository(): IFriendshipRepository;
	newDirectMessageRepository(): IDirectMessageRepository;
}
