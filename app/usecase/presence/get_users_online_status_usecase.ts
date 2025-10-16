import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

type UserOnlineStatus = {
	userId: string;
	isOnline: boolean;
};

export class GetUsersOnlineStatusUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(userIds: string[]): Promise<UserOnlineStatus[]> {
		if (userIds.length === 0) {
			return [];
		}

		const userIdObjs = userIds.map((id) => new UserId(id));
		const presenceRepo = this.repository.newUserPresenceRepository();
		const statusMap = await presenceRepo.getUsersOnlineStatus(userIdObjs);

		return userIds.map((userId) => ({
			userId,
			isOnline: statusMap.get(userId) ?? false,
		}));
	}
}
