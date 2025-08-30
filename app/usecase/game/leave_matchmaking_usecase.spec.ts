import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import type { MatchmakingService } from "../../domain/service/matchmaking_service";
import { LeaveMatchmakingUseCase } from "./leave_matchmaking_usecase";

describe("LeaveMatchmakingUseCase", () => {
	const matchmakingService = mock<MatchmakingService>();
	let useCase: LeaveMatchmakingUseCase;

	beforeEach(() => {
		vi.clearAllMocks();
		useCase = new LeaveMatchmakingUseCase(matchmakingService);
	});

	it("should call the leave method of matchmaking service with the correct user ID", async () => {
		const userId = ulid();
		matchmakingService.leave.mockResolvedValue(undefined);

		await useCase.execute(userId);

		expect(matchmakingService.leave).toHaveBeenCalledTimes(1);
		expect(matchmakingService.leave).toHaveBeenCalledWith(userId);
	});

	it("should rethrow the error if the matchmaking service fails", async () => {
		const userId = ulid();
		const expectedError = new Error("User not in queue");
		matchmakingService.leave.mockRejectedValue(expectedError);

		await expect(useCase.execute(userId)).rejects.toThrow(expectedError);
	});
});
