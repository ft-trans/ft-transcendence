import { ErrNotFound } from "../../domain/error";
import type { Match } from "../../domain/model/match";
import { UserId } from "../../domain/model/user";
import type { IUserRepository } from "../../domain/repository/user_repository";
import type { MatchmakingService } from "../../domain/service/matchmaking_service";

export class JoinMatchmakingUseCase {
	constructor(
		private readonly userRepository: IUserRepository,
		private readonly matchmakingService: MatchmakingService,
	) {}

	async execute(userIdValue: string): Promise<Match | undefined> {
		const userId = new UserId(userIdValue);
		const user = await this.userRepository.findById(userId);

		if (!user) {
			throw new ErrNotFound();
		}
		const match = await this.matchmakingService.join(user);
		return match ?? undefined;
	}
}