import type { IKVSRepository, IPongBallRepository } from "@domain/repository";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { EndPongUsecase } from "./end_pong_usecase";

describe("EndPongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should end the pong game", async () => {
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.delete.mockResolvedValue();
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new EndPongUsecase(repo);

		const matchId = ulid();

		const endMatchId = await usecase.execute({ matchId });

		expect(endMatchId.value).toEqual(matchId);
		expect(mockBallRepo.delete).toHaveBeenCalledOnce();
	});
});
