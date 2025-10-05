import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

export class SetUserOfflineUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userId: string): Promise<void> {
		const userIdObj = new UserId(userId);
		const presenceRepo = this.repository.newUserPresenceRepository();
		await presenceRepo.setUserOffline(userIdObj);
	}
}
