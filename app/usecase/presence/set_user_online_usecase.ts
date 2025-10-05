import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

export class SetUserOnlineUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userId: string, ttl?: number): Promise<void> {
		const userIdObj = new UserId(userId);
		const presenceRepo = this.repository.newUserPresenceRepository();
		await presenceRepo.setUserOnline(userIdObj, ttl);
	}
}
