import { ErrInternalServer } from "@domain/error";
import type { MatchId, PongClient } from "@domain/model";
import type { IPongClientRepository } from "@domain/repository";

export class PongClientRepository implements IPongClientRepository {
	// key: MatchId string (Objects cannot be used as Map keys, so string keys are used instead.)
	private static readonly clients = new Map<string, Set<PongClient>>();

	get(matchId: MatchId): Set<PongClient> | undefined {
		return PongClientRepository.clients.get(matchId.value);
	}

	add(matchId: MatchId, pongClient: PongClient): Set<PongClient> {
		if (!PongClientRepository.clients.has(matchId.value)) {
			PongClientRepository.clients.set(matchId.value, new Set<PongClient>());
		}
		PongClientRepository.clients.get(matchId.value)?.add(pongClient);
		const clients = PongClientRepository.clients.get(matchId.value);
		if (!clients) {
			throw new ErrInternalServer({ systemMessage: "Failed to add client" });
		}
		return clients;
	}

	delete(
		matchId: MatchId,
		pongClient: PongClient,
	): Set<PongClient> | undefined {
		PongClientRepository.clients.get(matchId.value)?.delete(pongClient);
		if (PongClientRepository.clients.get(matchId.value)?.size === 0) {
			PongClientRepository.clients.delete(matchId.value);
		}
		return PongClientRepository.clients.get(matchId.value);
	}
}
