import { MatchId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";

export type AddPongClientUsecaseInput = {
	matchId: string;
	client: IPongClient;
};

export class AddPongClientUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: AddPongClientUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		this.repo.newPongClientRepository().add(matchId, input.client);
		return matchId;
	}
}
