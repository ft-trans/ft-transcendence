import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongMatchStateRepository,
	IPongPaddleRepository,
	ISessionRepository,
	IUserPresenceRepository,
	IUserRepository,
} from "@domain/repository";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { StartPongUsecase } from "./start_pong_usecase";

const pongBallRepo = mock<IPongBallRepository>();

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongBallRepository: () => pongBallRepo,
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newUserPresenceRepository: () => mock<IUserPresenceRepository>(),
	newPongClientRepository: () => mock<IPongClientRepository>(),
	newPongLoopRepository: () => mock<IPongLoopRepository>(),
	newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
	newMatchRepository: () => mock<IMatchRepository>(),
};

describe("StartPongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should start a new pong match", async () => {
		const matchId = ulid();

		const usecase = new StartPongUsecase(repo);
		const input = { matchId: matchId };
		const ret = await usecase.execute(input);

		expect(ret.value).toBe(matchId);

		expect(repo.newPongBallRepository().set).toHaveBeenCalledOnce();
	});
});
