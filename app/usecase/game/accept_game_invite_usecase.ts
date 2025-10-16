import { UserId } from "@domain/model/user";
import type { IUserRepository } from "@domain/repository/user_repository";
import type { MatchmakingService } from "@domain/service/matchmaking_service";

export interface AcceptGameInviteRequest {
	accepterId: string; // ゲーム招待を受理した人
	senderId: string; // ゲーム招待を送った人
}

export class AcceptGameInviteUsecase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly matchmakingService: MatchmakingService,
	) {}

	async execute(
		input: AcceptGameInviteRequest,
	): Promise<{ success: boolean; matchId?: string }> {
		// Get both users
		const accepterId = new UserId(input.accepterId);
		const senderId = new UserId(input.senderId);

		const accepter = await this.userRepository.findById(accepterId);
		if (!accepter) {
			throw new Error("Accepter not found");
		}

		const sender = await this.userRepository.findById(senderId);
		if (!sender) {
			throw new Error("Sender not found");
		}

		// Add both users to matchmaking queue
		// First add the sender, then the accepter
		// This should immediately create a match since we have 2 users
		await this.matchmakingService.join(sender);
		const match = await this.matchmakingService.join(accepter);

		return { success: true, matchId: match?.id };
	}
}
