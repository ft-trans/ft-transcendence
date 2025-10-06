import {
	MatchId,
	type PongPaddle,
	type PongPaddleDirection,
	type PongPlayer,
	UserId,
} from "@domain/model";
import type { IRepository } from "@domain/repository";

export type UpdatePongPaddleUsecaseInput = {
	matchId: string;
	player: PongPlayer;
	direction: PongPaddleDirection;
	userId: string | undefined;
};

export class UpdatePongPaddleUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(
		input: UpdatePongPaddleUsecaseInput,
	): Promise<PongPaddle | undefined> {
		if (!input.userId) {
			return undefined;
		}
		const userId = new UserId(input.userId);
		const matchId = new MatchId(input.matchId);
		if (!this.isPlayerInMatch(matchId, userId, input.player)) {
			return undefined;
		}

		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const paddle = await pongPaddleRepo.get(matchId, input.player);
		if (!paddle) {
			return undefined;
		}
		const newPaddle = paddle.move(input.direction);
		await pongPaddleRepo.set(matchId, input.player, newPaddle);
		return newPaddle;
	}

	private isPlayerInMatch(
		matchId: MatchId,
		userId: UserId,
		player: PongPlayer,
	): boolean {
		const matchStateRepo = this.repo.newPongMatchStateRepository();
		const matchState = matchStateRepo.get(matchId);
		if (!matchState) {
			return false;
		}
		if (player === "player1") {
			return matchState.playerIds.player1.equals(userId);
		} else {
			return matchState.playerIds.player2.equals(userId);
		}
	}
}
