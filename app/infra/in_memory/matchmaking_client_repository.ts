import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";

export interface IMatchmakingClientRepository {
	add(userId: string, client: WebSocket, req: FastifyRequest): void;
	remove(userId: string): void;
	findByUserId(userId: string): WebSocket | undefined;
}

export class InMemoryMatchmakingClientRepository
	implements IMatchmakingClientRepository
{
	private readonly clients = new Map<string, WebSocket>();

	add(userId: string, client: WebSocket): void {
		this.clients.set(userId, client);
	}

	remove(userId: string): void {
		this.clients.delete(userId);
	}

	findByUserId(userId: string): WebSocket | undefined {
		return this.clients.get(userId);
	}
}