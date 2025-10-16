import { ErrInternalServer } from "@domain/error";
import type { MatchId } from "@domain/model";
import type { IPongClientRepository } from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";

export class PongClientRepository implements IPongClientRepository {
	// key: MatchId string (Objects cannot be used as Map keys, so string keys are used instead.)
	private static readonly clients = new Map<string, Set<IPongClient>>();

	get(matchId: MatchId): Set<IPongClient> | undefined {
		return PongClientRepository.clients.get(matchId.value);
	}

	add(matchId: MatchId, pongClient: IPongClient): Set<IPongClient> {
		if (!PongClientRepository.clients.has(matchId.value)) {
			PongClientRepository.clients.set(matchId.value, new Set<IPongClient>());
		}
		PongClientRepository.clients.get(matchId.value)?.add(pongClient);
		const clients = PongClientRepository.clients.get(matchId.value);
		if (!clients) {
			throw new ErrInternalServer({ systemMessage: "Failed to add client" });
		}
		return clients;
	}

	closeAndDelete(
		matchId: MatchId,
		pongClient: IPongClient,
	): Set<IPongClient> | undefined {
		pongClient.close();
		PongClientRepository.clients.get(matchId.value)?.delete(pongClient);
		if (PongClientRepository.clients.get(matchId.value)?.size === 0) {
			PongClientRepository.clients.delete(matchId.value);
		}
		return PongClientRepository.clients.get(matchId.value);
	}

	closeAndDeleteAll(matchId: MatchId): void {
		PongClientRepository.clients.get(matchId.value)?.forEach((client) => {
			if (client.isOpen()) {
				client.close();
			}
		});
		PongClientRepository.clients.delete(matchId.value);
	}
}
