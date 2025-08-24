import type { MatchmakingService } from "../../domain/service/matchmaking_service";

export class LeaveMatchmakingUseCase {
	constructor(private readonly matchmakingService: MatchmakingService) {}

	async execute(userId: string): Promise<void> {
		await this.matchmakingService.leave(userId);
	}
}
