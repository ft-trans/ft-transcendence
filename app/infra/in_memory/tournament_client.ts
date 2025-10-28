import type { TournamentId } from "@domain/model";
import type { ITournamentClient } from "@domain/service/tournament_client";
import type { TournamentServerMessage } from "@shared/api/tournament";

/**
 * Simplified WebSocket interface
 */
interface SimplifiedWebSocket {
	send(data: string): void;
	close(): void;
}

/**
 * In-Memoryトーナメントクライアント実装
 */
export class InMemoryTournamentClient implements ITournamentClient {
	private readonly tournamentIds = new Set<string>();

	constructor(
		private readonly socket: SimplifiedWebSocket,
		private readonly userId: string,
	) {}

	getUserId(): string | undefined {
		return this.userId;
	}

	getTournamentIds(): Set<string> {
		return new Set(this.tournamentIds);
	}

	subscribeTournament(tournamentId: TournamentId): void {
		this.tournamentIds.add(tournamentId.value);
	}

	unsubscribeTournament(tournamentId: TournamentId): void {
		this.tournamentIds.delete(tournamentId.value);
	}

	send(message: TournamentServerMessage): void {
		try {
			this.socket.send(JSON.stringify(message));
		} catch (error) {
			console.error(
				`[TournamentClient] Failed to send message to user ${this.userId}:`,
				error,
			);
		}
	}

	close(): void {
		try {
			this.socket.close();
		} catch (error) {
			console.error(
				`[TournamentClient] Failed to close connection for user ${this.userId}:`,
				error,
			);
		}
	}
}
