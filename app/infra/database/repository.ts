import type { IRepository, IUserRepository } from "@domain/repository";
import type { PrismaClient } from "./generated";
import { UserRepository } from "./user_repository";

export class Repository implements IRepository {
	constructor(private readonly client: PrismaClient) {}

	newUserRepository(): IUserRepository {
		return new UserRepository(this.client);
	}
}
