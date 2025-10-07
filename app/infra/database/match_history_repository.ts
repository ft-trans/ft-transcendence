import { MatchHistoryId, MatchId, UserId } from "@domain/model";
import { MatchHistory } from "@domain/model/match_history";
import type { IMatchHistoryRepository } from "@domain/repository/match_history_repository";
import type { Client } from "./prisma";

export class MatchHistoryRepository implements IMatchHistoryRepository {
	constructor(private readonly client: Client) {}
	async create(matchHistory: MatchHistory): Promise<MatchHistory> {
		const hist = await this.client.matchHistory.create({
			data: {
				id: matchHistory.id.value,
				matchId: matchHistory.matchId.value,
				winnerId: matchHistory.winnerId.value,
				loserId: matchHistory.loserId.value,
				winnerScore: matchHistory.winnerScore,
				loserScore: matchHistory.loserScore,
				playedAt: matchHistory.playedAt,
			},
		});
		return new MatchHistory(
			new MatchHistoryId(hist.id),
			new MatchId(hist.matchId),
			new UserId(hist.winnerId),
			new UserId(hist.loserId),
			hist.winnerScore,
			hist.loserScore,
			hist.playedAt,
		);
	}
	// async findByUserId(userId: string): Promise<MatchHistory[]> {}
}
