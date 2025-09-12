import type { MatchId, PongBall } from "@domain/model";
import type { IPongBallRepository } from "@domain/repository";
import type { Client } from "./repository";

export class PongBallRepository implements IPongBallRepository {
	constructor(private readonly client: Client) {}

	async set(matchId: MatchId, ball: PongBall): Promise<PongBall> {
		await this.client.set(this.getKey(matchId), JSON.stringify(ball));
		return ball;
	}

	async get(matchId: MatchId): Promise<PongBall | undefined> {
		const data = await this.client.get(this.getKey(matchId));
		return data ? JSON.parse(data) : undefined;
	}

	async delete(matchId: MatchId): Promise<void> {
		await this.client.del(this.getKey(matchId));
	}

	private getKey(matchId: MatchId): string {
		return `match:${matchId.value}:ball`;
	}
}
