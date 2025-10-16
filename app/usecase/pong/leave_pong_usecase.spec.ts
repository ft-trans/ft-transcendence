import { MatchId, type PongLoopId } from "@domain/model/pong";
import type {
	IPongClientRepository,
	IPongLoopRepository,
} from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";
import { createMockRepository } from "@usecase/test_helper";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { LeavePongUsecase } from "./leave_pong_usecase";

const pongClientRepo = mock<IPongClientRepository>();
const pongLoopRepo = mock<IPongLoopRepository>();

const repo = createMockRepository({
	newPongClientRepository: () => pongClientRepo,
	newPongLoopRepository: () => pongLoopRepo,
});

describe("LeavePongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should leave a user and stop loop when the last user", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);
		pongClientRepo.closeAndDelete.mockReturnValue(undefined);

		const usecase = new LeavePongUsecase(repo);
		const input = { matchId: matchId, client: pongClient, userId: undefined };
		const ret = await usecase.execute(input);
		expect(ret.value).toBe(matchId);

		expect(
			repo.newPongClientRepository().closeAndDelete,
		).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().closeAndDelete).toHaveBeenCalledWith(
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
		pongClientRepo.closeAndDelete.mockReturnValue(new Set([otherPongClient]));

		const usecase = new LeavePongUsecase(repo);
		const input = { matchId: matchId, client: pongClient, userId: undefined };
		const ret = await usecase.execute(input);
		expect(ret.value).toBe(matchId);

		expect(
			repo.newPongClientRepository().closeAndDelete,
		).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().closeAndDelete).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().delete).not.toHaveBeenCalled();
	});
});
