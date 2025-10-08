import { ErrBadRequest, ErrInternalServer, ErrNotFound } from "@domain/error";
import { MatchId, PongPaddle, UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";

export type JoinPongUsecaseInput = {
	matchId: string;
	client: IPongClient;
	userId: string | undefined;
};

export class JoinPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: JoinPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		this.repo.newPongClientRepository().add(matchId, input.client);
		await this.setPaddle(matchId);
		await this.setPongMatchState(matchId, input.userId);
		return matchId;
	}

	private async setPaddle(matchId: MatchId): Promise<void> {
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const paddle1 = await pongPaddleRepo.get(matchId, "player1");
		if (!paddle1) {
			await pongPaddleRepo.set(
				matchId,
				"player1",
				PongPaddle.createInitial("player1"),
			);
		}
		const paddle2 = await pongPaddleRepo.get(matchId, "player2");
		if (!paddle2) {
			await pongPaddleRepo.set(
				matchId,
				"player2",
				PongPaddle.createInitial("player2"),
			);
		}
	}

	private async setPongMatchState(
		matchId: MatchId,
		userIdStr: string | undefined,
	): Promise<void> {
		const matchRepo = this.repo.newMatchRepository();
		const match = await matchRepo.findById(matchId.value);
		if (!match) {
			throw new ErrNotFound();
		}
		if (match.status === "completed") {
			throw new ErrBadRequest({
				details: { match: "対戦はすでに終了しています。" },
			});
		}

		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepo.get(matchId);
		if (!state) {
			throw new ErrInternalServer({
				systemMessage: "PongMatchState not found",
			});
		}
		if (!userIdStr) {
			return;
		}
		const userId = new UserId(userIdStr);
		if (state.playerIds.player1.equals(userId)) {
			const newState = state.updatePlayerState("player1", "playing");
			pongMatchStateRepo.set(matchId, newState);
		} else if (state.playerIds.player2.equals(userId)) {
			const newState = state.updatePlayerState("player2", "playing");
			pongMatchStateRepo.set(matchId, newState);
		}
	}
}
