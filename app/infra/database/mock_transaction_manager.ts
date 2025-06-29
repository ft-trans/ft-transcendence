import type { ITransactionManager } from "../../usecase";

export class MockTransactionManager implements ITransactionManager {
	async begin<T>(callback: () => Promise<T>): Promise<T> {
		const result = await callback();
		return result;
	}
}
