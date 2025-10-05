import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

export class IsUserOnlineUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userId: string): Promise<boolean> {
		const userIdObj = new UserId(userId);
		const presenceRepo = this.repository.newUserPresenceRepository();
		return await presenceRepo.isUserOnline(userIdObj);
	}
}
