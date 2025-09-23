import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { ErrNotFound } from "../../domain/error";
import { User, UserEmail, UserId, Username, UserAvatar, UserStatusValue } from "../../domain/model/user";
import type { IUserRepository } from "../../domain/repository/user_repository";
import type { MatchmakingService } from "../../domain/service/matchmaking_service";
import { JoinMatchmakingUseCase } from "./join_matchmaking_usecase";

describe("JoinMatchmakingUseCase", () => {
	const userRepository = mock<IUserRepository>();
	const matchmakingService = mock<MatchmakingService>();
	let useCase: JoinMatchmakingUseCase;

	beforeEach(() => {
		vi.clearAllMocks();
		useCase = new JoinMatchmakingUseCase(userRepository, matchmakingService);
	});

	it("should successfully add a user to the matchmaking queue", async () => {
		const userId = new UserId(ulid());
		const userEmail = new UserEmail("test@example.com");
		const username = new Username("testuser");
		const avatar = new UserAvatar("");
		const status = new UserStatusValue("online");
		const user = User.reconstruct(userId, userEmail, username, avatar, status);

		userRepository.findById.mockResolvedValue(user);

		await useCase.execute(userId.value);

		expect(userRepository.findById).toHaveBeenCalledWith(userId);
		expect(matchmakingService.join).toHaveBeenCalledWith(user);
	});

	it("should throw ErrNotFound if user is not found", async () => {
		const userIdValue = ulid();
		const userId = new UserId(userIdValue);
		userRepository.findById.mockResolvedValue(undefined);

		await expect(useCase.execute(userIdValue)).rejects.toThrow(ErrNotFound);
		expect(userRepository.findById).toHaveBeenCalledWith(userId);
	});
});
