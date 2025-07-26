import { BadRequestError } from "@domain/error";
import { User, UserEmail } from "@domain/model";
import type { IUserRepository } from "@domain/repository";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUserUsecase } from "./register_user_usecase";

const mockUserRepository: IUserRepository = {
	create: vi.fn(),
	findById: vi.fn(),
	findByEmail: vi.fn(),
};

const tx: ITransaction = {
	exec: vi.fn().mockImplementation(async (callback) => {
		const repo = {
			newUserRepository: () => mockUserRepository,
		};
		return callback(repo);
	}),
};

describe("RegisterUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create a new user and return it", async () => {
		const expectedUser = User.create(new UserEmail("test@example.com"));
		vi.mocked(mockUserRepository.create).mockResolvedValue(expectedUser);
		vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(undefined);

		const usecase = new RegisterUserUsecase(tx);
		const input = { email: "test@example.com" };
		const user = await usecase.execute(input);

		expect(user.email).toEqual(expectedUser.email);
		expect(tx.exec).toHaveBeenCalledOnce();
	});

	it("should throw BadRequestError if email is already used", async () => {
		const existingUser = User.create(new UserEmail("test@example.com"));
		vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(existingUser);

		const usecase = new RegisterUserUsecase(tx);
		const input = { email: "test@example.com" };

		await expect(usecase.execute(input)).rejects.toThrow(BadRequestError);
	});
});
