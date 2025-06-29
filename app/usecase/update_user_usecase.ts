import { UserName } from "../domain/model";
import { UserId } from "../domain/model/user";
import type { IUserRepository } from "../domain/repository";
import { UserService } from "../domain/service";
import type { ITransactionManager } from "./transaction_manager";

export type UpdateUserInputDto = {
	id: string;
	name: string;
};

export type UpdateUserOutputDto = {
	id: string;
	name: string;
};

export class UpdateUserUsecase {
	constructor(
		private readonly transactionManager: ITransactionManager,
		private readonly userRepo: IUserRepository,
	) {}

	async execute(dto: UpdateUserInputDto): Promise<UpdateUserOutputDto> {
		const output = await this.transactionManager.begin(async () => {
			const id = new UserId(dto.id);
			const user = await this.userRepo.findById(id);
			if (!user) {
				throw new Error(`User with id ${id.value} not found.`);
			}

			const name = new UserName(dto.name);
			const new_user = user.changeName(name);

			const userService = new UserService(this.userRepo);
			if (await userService.exists(new_user)) {
				throw new Error(`User with name ${user.name} already exists.`);
			}

			await this.userRepo.update(new_user);
			return {
				id: new_user.id.value,
				name: new_user.name.value,
			};
		});
		return output;
	}
}
