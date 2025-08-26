import type { Ball, MatchId } from "@domain/model";
import type { IBallRepository } from "@domain/repository";
import type { Client } from "./repository";

export class BallRepository implements IBallRepository {
	constructor(private readonly client: Client) {}

	async set(matchId: MatchId, ball: Ball): Promise<Ball> {
		this.client.set(`match:${matchId}:ball`, JSON.stringify(ball));
		return ball;
	}

	async get(matchId: MatchId): Promise<Ball | undefined> {
		const data = await this.client.get(`match:${matchId}:ball`);
		return data ? JSON.parse(data) : undefined;
	}

	async delete(matchId: MatchId): Promise<void> {
		this.client.del(`match:${matchId}:ball`);
	}
}
