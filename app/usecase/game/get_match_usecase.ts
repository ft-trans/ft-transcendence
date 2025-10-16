import type { Match } from "@domain/model";
import type { IMatchRepository } from "@domain/repository";

export class GetMatchUseCase {
	constructor(private readonly matchRepository: IMatchRepository) {}

	async execute(userId: string): Promise<Match | undefined> {
		return await this.matchRepository.findInProgressMatchByUserId(userId);
	}
}
