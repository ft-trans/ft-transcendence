import { NotFoundError } from "@domain/error";
import type { User } from "@domain/model";
import { UserEmail, UserId } from "@domain/model";
import type { IRepository, IUserRepository } from "@domain/repository";
import { ulid } from "ulid";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { FindUserUsecase } from "./find_user_usecase";

const user: User = {
	id: new UserId(ulid()),
	email: new UserEmail("test@example.com"),
};

const mockUserRepository: IUserRepository = {
	findById: vi.fn(),
};

const mockRepository: IRepository = {
	newUserRepository: vi.fn(() => mockUserRepository),
};

describe("FindUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("should return user when user is found", async () => {
		const usecase = new FindUserUsecase(mockRepository);
		vi.mocked(mockUserRepository.findById).mockResolvedValue(user);

		const result = await usecase.run(user.id);

		expect(result).toEqual(user);
		expect(mockRepository.newUserRepository).toHaveBeenCalledOnce();
		expect(mockUserRepository.findById).toHaveBeenCalledOnce();
		expect(mockUserRepository.findById).toHaveBeenCalledWith(user.id);
	});

	test("should throw NotFoundError when user is not found", async () => {
		const usecase = new FindUserUsecase(mockRepository);
		vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

		await expect(usecase.run(user.id)).rejects.toThrow(NotFoundError);
		expect(mockRepository.newUserRepository).toHaveBeenCalledOnce();
		expect(mockUserRepository.findById).toHaveBeenCalledOnce();
		expect(mockUserRepository.findById).toHaveBeenCalledWith(user.id);
	});
});
