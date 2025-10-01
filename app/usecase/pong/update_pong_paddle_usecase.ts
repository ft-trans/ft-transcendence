import {
	MatchId,
	type PongPaddle,
	type PongPaddleDirection,
	type PongPlayer,
} from "@domain/model";
import type { IRepository } from "@domain/repository";

export type UpdatePongPaddleUsecaseInput = {
	matchId: string;
	player: PongPlayer;
	direction: PongPaddleDirection;
};

export class UpdatePongPaddleUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(
		input: UpdatePongPaddleUsecaseInput,
	): Promise<PongPaddle | undefined> {
		const matchId = new MatchId(input.matchId);
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const paddle = await pongPaddleRepo.get(matchId, input.player);
		if (!paddle) {
			return undefined;
		}
		const newPaddle = paddle.move(input.direction);
		await pongPaddleRepo.set(matchId, input.player, newPaddle);
		return newPaddle;
	}
}
