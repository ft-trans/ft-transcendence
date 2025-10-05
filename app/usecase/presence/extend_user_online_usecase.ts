import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

export class ExtendUserOnlineUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userId: string, ttl?: number): Promise<void> {
		const userIdObj = new UserId(userId);
		const presenceRepo = this.repository.newUserPresenceRepository();
		await presenceRepo.extendUserOnline(userIdObj, ttl);
	}
}

export class IsUserOnlineUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userId: string): Promise<boolean> {
		const userIdObj = new UserId(userId);
		const presenceRepo = this.repository.newUserPresenceRepository();
		return await presenceRepo.isUserOnline(userIdObj);
	}
}
