import { MatchId, UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";

export type LeavePongUsecaseInput = {
	matchId: string;
	client: IPongClient;
	userId: string | undefined;
};

export class LeavePongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: LeavePongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		const pongClientRepo = this.repo.newPongClientRepository();
		pongClientRepo.closeAndDelete(matchId, input.client);

		this.leavePlayer(matchId, input.userId);
		return matchId;
	}

	private leavePlayer(matchId: MatchId, userIdStr: string | undefined): void {
		if (!userIdStr) {
			return;
		}
		const userId = new UserId(userIdStr);
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepo.get(matchId);
		if (!state) {
			return;
		}
		if (state.playerIds.player1.equals(userId)) {
			const newState = state.updatePlayerState("player1", "left");
			pongMatchStateRepo.set(matchId, newState);
		} else if (state.playerIds.player2.equals(userId)) {
			const newState = state.updatePlayerState("player2", "left");
			pongMatchStateRepo.set(matchId, newState);
		}
	}
}
