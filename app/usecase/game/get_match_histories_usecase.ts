import { ErrBadRequest } from "@domain/error";
import { type MatchHistory, UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";

export type GetMatchHistoriesUseCaseInput = {
	userId: string;
	page: number;
};

export class GetMatchHistoriesUseCase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: GetMatchHistoriesUseCaseInput): Promise<MatchHistory[]> {
		const userId = new UserId(input.userId);
		if (input.page < 1) {
			throw new ErrBadRequest({
				userMessage: "ページは1以上である必要があります。",
			});
		}
		const matchHistoryRepository = this.repo.newMatchHistoryRepository();
		return matchHistoryRepository.findByUserIdWithPagination(
			userId,
			input.page,
		);
	}
}
