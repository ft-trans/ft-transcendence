import { MatchId } from "@domain/model";
import type { IKVSRepository } from "@domain/repository";

export type EndPongUsecaseInput = {
	matchId: string;
};

export class EndPongUsecase {
	constructor(private readonly repo: IKVSRepository) {}

	async execute(input: EndPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);

		await this.repo.newPongBallRepository().delete(matchId);

		return matchId;
	}
}
