import type { IRepository } from "@domain/repository";

export class GetOnlineUsersUsecase {
	constructor(private readonly repository: IRepository) {}

	async execute(): Promise<string[]> {
		const presenceRepo = this.repository.newUserPresenceRepository();
		const onlineUserIds = await presenceRepo.getOnlineUsers();
		return onlineUserIds.map((id) => id.value);
	}
}
