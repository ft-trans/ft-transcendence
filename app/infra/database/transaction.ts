import type { IRepository } from "@domain/repository";
import type { FastifyRedis } from "@fastify/redis";
import type { ITransaction } from "@usecase/transaction";
import { Repository } from "../repository";
import type { Prisma } from "./generated";

export class Transaction implements ITransaction {
	constructor(
		private readonly client: Prisma.DefaultPrismaClient,
		private readonly kvsClient: FastifyRedis,
	) {}

	async exec<T>(
		callback: (repo: IRepository) => Promise<T | undefined>,
	): Promise<T | undefined> {
		return this.client.$transaction(async (tx) => {
			const repo = new Repository(tx, this.kvsClient);

			const result = await callback(repo);
			return result;
		});
	}
}
