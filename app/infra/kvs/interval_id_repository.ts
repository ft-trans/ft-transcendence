import type { IntervalId, MatchId } from "@domain/model";
import type { IIntervalIdRepository } from "@domain/repository";
import type { Client } from "./repository";

export class IntervalIdRepository implements IIntervalIdRepository {
	constructor(private readonly client: Client) {}

	async set(matchId: MatchId, intervalId: IntervalId): Promise<IntervalId> {
		this.client.set(this.getKey(matchId), JSON.stringify(intervalId));
		return intervalId;
	}

	async get(matchId: MatchId): Promise<IntervalId | undefined> {
		const data = await this.client.get(this.getKey(matchId));
		return data ? JSON.parse(data) : undefined;
	}

	async delete(matchId: MatchId): Promise<void> {
		this.client.del(this.getKey(matchId));
	}

	private getKey(matchId: MatchId): string {
		return `match:${matchId.value}:interval_id`;
	}
}
