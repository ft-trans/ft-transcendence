import { UserId } from "../domain/model";
import type { IUserRepository } from "../domain/repository";
import type { ITransactionManager } from "./transaction_manager";

export type DeleteUserInputDto = {
	id: string;
};

export class DeleteUserUsecase {
	constructor(
		private readonly transactionManager: ITransactionManager,
		private readonly userRepo: IUserRepository,
	) {}

	async execute(dto: DeleteUserInputDto): Promise<void> {
		await this.transactionManager.begin(async () => {
			const userId = new UserId(dto.id);
			await this.userRepo.delete(userId);
		});
	}
}
