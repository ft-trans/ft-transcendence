// ==> app/usecase/auth/register_user_usecase.spec.ts <==
import { ErrBadRequest } from "@domain/error";
import { User, UserEmail, Username } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { RegisterUserUsecase } from "./register_user_usecase";

describe("RegisterUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create a new user and return it", async () => {
		const expectedUser = User.create(
			new UserEmail("test@example.com"),
			new Username("testuser"),
		);
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.create.mockResolvedValue(expectedUser);
		mockUserRepo.findByEmail.mockResolvedValue(undefined);
		mockUserRepo.findByUsername.mockResolvedValue(undefined);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newUserRepository: () => mockUserRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterUserUsecase(mockTx);
		const input = {
			email: "test@example.com",
			username: "testuser",
			password: "ValidPass123",
		};
		const user = await usecase.execute(input);

		expect(user.email).toEqual(expectedUser.email);
		expect(user.username).toEqual(expectedUser.username);
	});

	it("should throw BadRequestError if password is too short", async () => {
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findByEmail.mockResolvedValue(undefined);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newUserRepository: () => mockUserRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterUserUsecase(mockTx);
		const input = {
			email: "test@example.com",
			username: "testuser",
			password: "short",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
	});

	it("should throw BadRequestError if email is already used", async () => {
		const existingUser = User.create(
			new UserEmail("test@example.com"),
			new Username("testuser"),
		);
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findByEmail.mockResolvedValue(existingUser);
		mockUserRepo.findByUsername.mockResolvedValue(undefined);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newUserRepository: () => mockUserRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterUserUsecase(mockTx);
		const input = {
			email: "test@example.com",
			username: "testuser",
			password: "ValidPass123",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
	});
});
