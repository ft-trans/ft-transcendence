import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongPaddleRepository,
	ISessionRepository,
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
	newPongBallRepository: () => pongBallRepo,
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newPongClientRepository: () => mock<IPongClientRepository>(),
	newPongLoopRepository: () => mock<IPongLoopRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
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
