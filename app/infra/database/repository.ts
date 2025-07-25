import type { IRepository, IUserRepository } from "@domain/repository";
import type { Prisma, PrismaClient } from "./generated";
import { UserRepository } from "./user_repository";

export type Client = PrismaClient | Prisma.TransactionClient;

export class Repository implements IRepository {
	constructor(private readonly client: Client) {}

	newUserRepository(): IUserRepository {
		return new UserRepository(this.client);
	}
}
