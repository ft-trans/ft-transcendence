import type { IRepository } from "@domain/repository";
import type { ITransaction } from "@usecase/transaction";
import type { PrismaClient } from "./generated";
import { Repository } from "./repository";

export class Transaction implements ITransaction {
	constructor(private readonly client: PrismaClient) {}

	async exec<T>(
		callback: (repo: IRepository) => Promise<T | undefined>,
	): Promise<T | undefined> {
		return this.client.$transaction(async (tx) => {
			const repo = new Repository(tx);

			const result = await callback(repo);
			if (!result) {
				return undefined;
			}
			return result;
		});
	}
}
