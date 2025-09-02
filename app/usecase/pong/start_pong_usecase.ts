import { MatchId, PongBall } from "@domain/model";
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
		const dx = 20 * (0.5 - Math.random());
		const dy = 20 * (0.5 - Math.random());
		const ball = new PongBall({ x, y, dx, dy });

		await this.repo.newPongBallRepository().set(matchId, ball);

		return matchId;
	}
}
