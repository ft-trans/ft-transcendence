import type {
	IInMemoryRepository,
	IPongClientRepository,
	IPongLoopRepository,
} from "@domain/repository";
import { PongClientRepository } from "./pong_client_repository";
import { PongLoopRepository } from "./pong_loop_repository";

export class InMemoryRepository implements IInMemoryRepository {
	newPongClientRepository(): IPongClientRepository {
		return new PongClientRepository();
	}
	newPongLoopRepository(): IPongLoopRepository {
		return new PongLoopRepository();
	}
}
