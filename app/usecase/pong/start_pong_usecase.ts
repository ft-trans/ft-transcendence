import { Ball, MatchId } from "@domain/model";
import type { IKVSRepository } from "@domain/repository";
import { PongField } from "@shared/api/pong";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IKVSRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);

		const x = PongField.width / 2;
		const y = PongField.height * Math.random();
		const vx = 20 * (0.5 - Math.random());
		const vy = 20 * (0.5 - Math.random());
		const ball = new Ball(x, y, vx, vy);

		await this.repo.newBallRepository().set(matchId, ball);

		return matchId;
	}
}
