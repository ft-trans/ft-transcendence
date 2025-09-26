import { MatchId, type PongLoopId } from "@domain/model/pong";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongMatchStateRepository,
	IPongPaddleRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { LeavePongUsecase } from "./leave_pong_usecase";

const pongClientRepo = mock<IPongClientRepository>();
const pongLoopRepo = mock<IPongLoopRepository>();

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newPongClientRepository: () => pongClientRepo,
	newPongLoopRepository: () => pongLoopRepo,
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
};

describe("LeavePongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should leave a user and stop loop when the last user", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);
		pongClientRepo.delete.mockReturnValue(undefined);

		const usecase = new LeavePongUsecase(repo);
		const input = { matchId: matchId, client: pongClient };
		const ret = await usecase.execute(input);
		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().delete).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().delete).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().delete).toHaveBeenCalledOnce();
	});

	it("should leave a user but NOT stop loop when there are other users", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const otherPongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);
		pongClientRepo.delete.mockReturnValue(new Set([otherPongClient]));

		const usecase = new LeavePongUsecase(repo);
		const input = { matchId: matchId, client: pongClient };
		const ret = await usecase.execute(input);
		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().delete).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().delete).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().delete).not.toHaveBeenCalled();
	});
});
