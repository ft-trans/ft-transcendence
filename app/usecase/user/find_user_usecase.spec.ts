import { ErrNotFound } from "@domain/error";
import { User, UserEmail, Username } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { FindUserUsecase } from "./find_user_usecase";

describe("FindUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return user when user is found", async () => {
		const user = User.create(
			new UserEmail("test@example.com"),
			new Username("test"),
		);

		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findById.mockResolvedValue(user);
		const mockRepo = createMockRepository({
			newUserRepository: () => mockUserRepo,
		});

		const usecase = new FindUserUsecase(mockRepo);

		const result = await usecase.run(user.id);

		expect(result).toEqual(user);
		expect(mockUserRepo.findById).toHaveBeenCalledOnce();
		expect(mockUserRepo.findById).toHaveBeenCalledWith(user.id);
	});

	test("should throw NotFoundError when user is not found", async () => {
		const user = User.create(
			new UserEmail("test@example.com"),
			new Username("test"),
		);

		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findById.mockResolvedValue(undefined);
		const mockRepository = createMockRepository({
			newUserRepository: () => mockUserRepo,
		});

		const usecase = new FindUserUsecase(mockRepository);

		await expect(usecase.run(user.id)).rejects.toThrow(ErrNotFound);
		expect(mockUserRepo.findById).toHaveBeenCalledOnce();
		expect(mockUserRepo.findById).toHaveBeenCalledWith(user.id);
	});
});
