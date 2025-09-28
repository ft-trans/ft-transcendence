import { MatchId, type PongLoopId } from "@domain/model/pong";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { JoinPongUsecase } from "./join_pong_usecase";

const pongClientRepo = mock<IPongClientRepository>();
const pongLoopRepo = mock<IPongLoopRepository>();

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongClientRepository: () => pongClientRepo,
	newPongLoopRepository: () => pongLoopRepo,
	newSessionRepository: () => mock<ISessionRepository>(),
	newMatchRepository: () => mock<IMatchRepository>(),
};

describe("JoinPongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should join a user to a match and return the match ID", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		pongLoopRepo.get.mockReturnValue(undefined);

		const usecase = new JoinPongUsecase(repo);
		const input = { matchId: matchId, client: pongClient };
		const ret = await usecase.execute(input);

		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().add).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().add).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().set).toHaveBeenCalledOnce();
	});

	it("should not create a new loop if one already exists with the same matchId", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);

		const usecase = new JoinPongUsecase(repo);
		const input = { matchId: matchId, client: pongClient };
		const ret = await usecase.execute(input);

		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().add).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().add).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().get).toHaveBeenCalledOnce();
		expect(repo.newPongLoopRepository().set).not.toHaveBeenCalled();
	});
});
