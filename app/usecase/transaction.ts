import type { IRepository } from "@domain/repository";

export interface ITransaction {
	exec<T>(
		callback: (repo: IRepository) => Promise<T | undefined>,
	): Promise<T | undefined>;
}
