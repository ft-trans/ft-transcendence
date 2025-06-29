import { User, UserName } from "../domain/model";
import type { IUserRepository } from "../domain/repository";
import { UserService } from "../domain/service";
import type { ITransactionManager } from "./transaction_manager";

export type RegisterUserInputDto = {
	name: string;
};

export type RegisterUserOutputDto = {
	id: string;
	name: string;
};

export class RegisterUserUsecase {
	constructor(
		private readonly transactionManager: ITransactionManager,
		private readonly userRepo: IUserRepository,
	) {}

	async execute(dto: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
		const output = await this.transactionManager.begin(async () => {
			const name = new UserName(dto.name);
			const user = User.create(name);

			const userService = new UserService(this.userRepo);
			if (await userService.exists(user)) {
				throw new Error(`User with name ${user.name.value} already exists.`);
			}

			await this.userRepo.create(user);
			return {
				id: user.id.value,
				name: user.name.value,
			};
		});
		return output;
	}
}
