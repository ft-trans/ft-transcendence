import { MatchId, type PongLoopId } from "@domain/model/pong";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchHistoryRepository,
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
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newUserPresenceRepository: () => mock<IUserPresenceRepository>(),
	newPongClientRepository: () => pongClientRepo,
	newPongLoopRepository: () => pongLoopRepo,
	newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
	newMatchRepository: () => mock<IMatchRepository>(),
	newMatchHistoryRepository: () => mock<IMatchHistoryRepository>(),
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
		const input = { matchId: matchId, client: pongClient, userId: undefined };
		const ret = await usecase.execute(input);
		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().delete).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().delete).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);
	});

	it("should leave a user but NOT stop loop when there are other users", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const otherPongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);
		pongClientRepo.delete.mockReturnValue(new Set([otherPongClient]));

		const usecase = new LeavePongUsecase(repo);
		const input = { matchId: matchId, client: pongClient, userId: undefined };
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
