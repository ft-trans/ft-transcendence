import type { User } from "../model/index";
import type { IUserRepository } from "../repository/index";

export class UserService {
	constructor(private readonly userRepo: IUserRepository) {}

	async exists(user: User): Promise<boolean> {
		const dup = await this.userRepo.findByName(user.name);
		return dup !== undefined;
	}
}
