import type { MatchId, PongPaddle, PongPlayer } from "@domain/model";
import type { IPongPaddleRepository } from "@domain/repository";
import type { KvsClient } from "../repository";

export class PongPaddleRepository implements IPongPaddleRepository {
	constructor(private readonly client: KvsClient) {}

	async set(
		matchId: MatchId,
		player: PongPlayer,
		paddle: PongPaddle,
	): Promise<PongPaddle> {
		await this.client.set(this.getKey(matchId, player), JSON.stringify(paddle));
		return paddle;
	}

	async get(
		matchId: MatchId,
		player: PongPlayer,
	): Promise<PongPaddle | undefined> {
		const data = await this.client.get(this.getKey(matchId, player));
		return data ? JSON.parse(data) : undefined;
	}

	async delete(matchId: MatchId, player: PongPlayer): Promise<void> {
		await this.client.del(this.getKey(matchId, player));
	}

	private getKey(matchId: MatchId, player: PongPlayer): string {
		return `match:${matchId.value}:paddle:${player}`;
	}
}
