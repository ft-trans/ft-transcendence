import type { Ball, MatchId } from "@domain/model";
import type { IBallRepository } from "@domain/repository";
import type { Client } from "./repository";

export class BallRepository implements IBallRepository {
	constructor(private readonly client: Client) {}

	async set(matchId: MatchId, ball: Ball): Promise<Ball> {
		this.client.set(this.getKey(matchId), JSON.stringify(ball));
		return ball;
	}

	async get(matchId: MatchId): Promise<Ball | undefined> {
		const data = await this.client.get(this.getKey(matchId));
		return data ? JSON.parse(data) : undefined;
	}

	async delete(matchId: MatchId): Promise<void> {
		this.client.del(this.getKey(matchId));
	}

	private getKey(matchId: MatchId): string {
		return `match:${matchId.value}:ball`;
	}
}
