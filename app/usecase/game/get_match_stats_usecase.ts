import type { UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import type { UserStats } from "@shared/api/profile";

export class GetMatchStatsUseCase {
	constructor(private readonly repo: IRepository) {}

	async execute(userId: UserId): Promise<UserStats> {
		const matchHistoryRepository = this.repo.newMatchHistoryRepository();
		const wins = await matchHistoryRepository.countWinByUserId(userId);
		const losses = await matchHistoryRepository.countLossByUserId(userId);

		const totalMatches = wins + losses;

		const winRate = totalMatches === 0 ? 0 : wins / totalMatches;

		return {
			totalMatches,
			wins,
			losses,
			winRate,
		};
	}
}
