import {
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	type UserStatus,
	UserStatusValue,
} from "@domain/model";
import { Match } from "@domain/model/match";
import type { IMatchRepository } from "@domain/repository/match_repository";
import type { Client } from "./prisma";

export class MatchRepository implements IMatchRepository {
	constructor(private readonly client: Client) {}

	private async hydrate(dbMatch: {
		id: string;
		status: string;
		gameType: string;
		createdAt: Date;
		updatedAt: Date;
		participants: { userId: string }[];
	}): Promise<Match> {
		const ids = (dbMatch.participants ?? []).map((p) => p.userId);

		const users = ids.length
			? await this.client.user.findMany({
					where: { id: { in: ids } },
					select: {
						id: true,
						email: true,
						username: true,
						avatar: true,
						status: true,
					},
				})
			: [];

		const map = new Map(
			users.map((u) => [
				u.id,
				User.reconstruct(
					new UserId(u.id),
					new UserEmail(u.email),
					new Username(u.username),
					new UserAvatar(u.avatar),
					new UserStatusValue(u.status as UserStatus),
				),
			]),
		);

		const participants: User[] = ids.map((id) => {
			const u = map.get(id);
			return (
				u ??
				User.reconstruct(
					new UserId(id),
					new UserEmail("unknown@example.com"),
					new Username("unknown"),
					new UserAvatar(""),
					new UserStatusValue("offline"),
				)
			);
		});

		return new Match(
			dbMatch.id,
			participants,
			dbMatch.status as "in_progress" | "completed",
			dbMatch.gameType as "Pong",
			dbMatch.createdAt,
			dbMatch.updatedAt ?? dbMatch.createdAt,
		);
	}

	async findById(id: string): Promise<Match | undefined> {
		const m = await this.client.match.findUnique({
			where: { id },
			include: {
				participants: {
					select: { userId: true },
				},
			},
		});
		if (!m) return undefined;
		return this.hydrate(m);
	}

	async findInProgressMatchByUserId(
		userId: string,
	): Promise<Match | undefined> {
		const m = await this.client.match.findFirst({
			where: {
				status: "in_progress",
				participants: { some: { userId } },
			},
			include: {
				participants: { select: { userId: true } },
			},
		});
		if (!m) return undefined;
		return this.hydrate(m);
	}

	async save(match: Match): Promise<Match> {
		await this.client.match.upsert({
			where: { id: match.id },
			update: {
				status: match.status,
				gameType: match.gameType,
				updatedAt: match.updatedAt,
				participants: {
					deleteMany: {},
					create: match.participants.map((p) => ({ userId: p.id.value })),
				},
			},
			create: {
				id: match.id,
				status: match.status,
				gameType: match.gameType,
				createdAt: match.createdAt,
				updatedAt: match.updatedAt,
				participants: {
					create: match.participants.map((p) => ({ userId: p.id.value })),
				},
			},
		});

		const stored = await this.client.match.findUnique({
			where: { id: match.id },
			include: { participants: { select: { userId: true } } },
		});

		return stored ? this.hydrate(stored) : match;
	}

	async create(match: Match): Promise<Match> {
		await this.client.match.create({
			data: {
				id: match.id,
				status: match.status,
				gameType: match.gameType,
				createdAt: match.createdAt,
				updatedAt: match.updatedAt,
				participants: {
					create: match.participants.map((p) => ({ userId: p.id.value })),
				},
			},
		});
		const stored = await this.client.match.findUnique({
			where: { id: match.id },
			include: { participants: { select: { userId: true } } },
		});
		return stored ? this.hydrate(stored) : match;
	}

	async update(match: Match): Promise<Match> {
		await this.client.match.update({
			where: { id: match.id },
			data: {
				status: match.status,
				gameType: match.gameType,
				updatedAt: match.updatedAt,
			},
		});
		const stored = await this.client.match.findUnique({
			where: { id: match.id },
			include: { participants: { select: { userId: true } } },
		});
		return stored ? this.hydrate(stored) : match;
	}
}
