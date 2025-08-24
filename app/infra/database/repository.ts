import type { IDirectMessageRepository } from "@domain/repository/direct_message_repository";
import type { IFriendshipRepository } from "@domain/repository/friendship_repository";
import type { IRepository } from "@domain/repository/repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import { DirectMessageRepository } from "./direct_message_repository";
import { FriendshipRepository } from "./friendship_repository";
import type { Prisma, PrismaClient } from "./generated";
import { UserRepository } from "./user_repository";

export type Client = PrismaClient | Prisma.TransactionClient;

export class Repository implements IRepository {
	constructor(private readonly client: Client) {}

	newUserRepository(): IUserRepository {
		return new UserRepository(this.client);
	}

	newFriendshipRepository(): IFriendshipRepository {
		return new FriendshipRepository(this.client);
	}

	newDirectMessageRepository(): IDirectMessageRepository {
		return new DirectMessageRepository(this.client);
	}
}
