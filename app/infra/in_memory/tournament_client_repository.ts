import type { TournamentId, UserId } from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import type { ITournamentClient } from "@domain/service/tournament_client";
import type { TournamentServerMessage } from "@shared/api/tournament";

/**
 * In-Memoryトーナメントクライアントリポジトリ実装
 */
export class InMemoryTournamentClientRepository
	implements ITournamentClientRepository
{
	private readonly clients = new Map<string, ITournamentClient>();

	add(client: ITournamentClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.set(userId, client);
		}
	}

	remove(client: ITournamentClient): void {
		const userId = client.getUserId();
		if (userId) {
			this.clients.delete(userId);
		}
	}

	findByUserId(userId: UserId): ITournamentClient | undefined {
		return this.clients.get(userId.value);
	}

	findByTournamentId(tournamentId: TournamentId): ITournamentClient[] {
		const result: ITournamentClient[] = [];
		for (const client of this.clients.values()) {
			if (client.getTournamentIds().has(tournamentId.value)) {
				result.push(client);
			}
		}
		return result;
	}

	findAll(): ITournamentClient[] {
		return Array.from(this.clients.values());
	}

	broadcastToTournament(
		tournamentId: TournamentId,
		message: TournamentServerMessage,
	): void {
		const clients = this.findByTournamentId(tournamentId);
		console.log(
			`[TournamentClientRepository] Broadcasting ${message.type} to ${clients.length} clients for tournament ${tournamentId.value}`,
		);
		for (const client of clients) {
			try {
				client.send(message);
			} catch (error) {
				console.error(
					`[TournamentClientRepository] Failed to send message to client:`,
					error,
				);
			}
		}
	}
}
