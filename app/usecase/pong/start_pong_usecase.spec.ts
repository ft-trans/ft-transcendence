import { PongBall } from "@domain/model";
import type { IKVSRepository, IPongBallRepository } from "@domain/repository";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { StartPongUsecase } from "./start_pong_usecase";

describe("StartPongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should start the pong game", async () => {
		const ball = new PongBall({ x: 1, y: 2, dx: 3, dy: 4 });
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.set.mockResolvedValue(ball);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new StartPongUsecase(repo);

		const matchId = ulid();
		const startMatchId = await usecase.execute({ matchId });

		expect(startMatchId.value).toEqual(matchId);
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});
});
