import {
	MatchHistoryId,
	MatchId,
	matchHistoryPageSize,
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	type UserStatus,
	UserStatusValue,
} from "@domain/model";
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
	async findByUserIdWithPagination(
		userId: UserId,
		page: number,
	): Promise<MatchHistory[]> {
		const histories = await this.client.matchHistory.findMany({
			where: {
				OR: [{ winnerId: userId.value }, { loserId: userId.value }],
			},
			orderBy: {
				playedAt: "desc",
			},
			skip: (page - 1) * matchHistoryPageSize,
			take: matchHistoryPageSize,
		});

		const userIds = histories.map((hist) => hist.winnerId);
		userIds.push(...histories.map((hist) => hist.loserId));
		const uniqueUserIds = Array.from(new Set(userIds));
		const users = await this.client.user.findMany({
			where: {
				id: { in: uniqueUserIds },
			},
		});
		const userMap = new Map(
			users.map((user) => [
				user.id,
				User.reconstruct(
					new UserId(user.id),
					new UserEmail(user.email),
					new Username(user.username),
					new UserAvatar(user.avatar),
					new UserStatusValue(user.status as UserStatus),
					user.passwordDigest,
				),
			]),
		);

		return histories.map(
			(hist) =>
				new MatchHistory(
					new MatchHistoryId(hist.id),
					new MatchId(hist.matchId),
					new UserId(hist.winnerId),
					new UserId(hist.loserId),
					hist.winnerScore,
					hist.loserScore,
					hist.playedAt,
					userMap.has(hist.winnerId) ? userMap.get(hist.winnerId) : undefined,
					userMap.has(hist.loserId) ? userMap.get(hist.loserId) : undefined,
				),
		);
	}

	async countWinByUserId(userId: UserId): Promise<number> {
		const count = await this.client.matchHistory.count({
			where: {
				winnerId: userId.value,
			},
		});
		return count;
	}

	async countLossByUserId(userId: UserId): Promise<number> {
		const count = await this.client.matchHistory.count({
			where: {
				loserId: userId.value,
			},
		});
		return count;
	}
}
