import { UserId } from "../domain/model";
import type { IUserRepository } from "../domain/repository";

export type FindUserInputDto = {
	id: string;
};

export type FindUserOutputDto = {
	id: string;
	name: string;
};

export class FindUserUsecase {
	constructor(private readonly userRepo: IUserRepository) {}

	async execute(dto: FindUserInputDto): Promise<FindUserOutputDto | undefined> {
		const id = new UserId(dto.id);
		const user = await this.userRepo.findById(id);
		if (!user) {
			return undefined;
		}
		return {
			id: user.id.value,
			name: user.name.value,
		};
	}
}
