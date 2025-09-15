import { Session, SessionId, type SessionToken, UserId } from "@domain/model";
import type { ISessionRepository } from "@domain/repository";
import type { Client } from "./repository";

export class SessionRepository implements ISessionRepository {
	constructor(private readonly prisma: Client) {}

	async create(session: Session): Promise<Session | undefined> {
		const createdSession = await this.prisma.session.create({
			data: {
				id: session.id.value,
				userId: session.userId.value,
				tokenDigest: session.tokenDigest,
				expiresAt: session.expiresAt,
			},
		});
		return Session.reconstruct(
			new SessionId(createdSession.id),
			new UserId(createdSession.userId),
			createdSession.tokenDigest,
			createdSession.expiresAt,
		);
	}

	async findByToken(token: SessionToken): Promise<Session | undefined> {
		const foundSession = await this.prisma.session.findUnique({
			where: { tokenDigest: token.value },
		});

		if (!foundSession) return undefined;

		return Session.reconstruct(
			new SessionId(foundSession.id),
			new UserId(foundSession.userId),
			foundSession.tokenDigest,
			foundSession.expiresAt,
		);
	}

	async deleteByToken(token: SessionToken): Promise<void> {
		await this.prisma.session.delete({
			where: { tokenDigest: token.value },
		});
	}
}
