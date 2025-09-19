// ==> app/usecase/auth/register_user_usecase.spec.ts <==
import { ErrBadRequest } from "@domain/error";
import { User, UserEmail } from "@domain/model";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongPaddleRepository,
	IUserRepository,
} from "@domain/repository";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { RegisterUserUsecase } from "./register_user_usecase";

describe("RegisterUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create a new user and return it", async () => {
		const expectedUser = User.create(new UserEmail("test@example.com"));
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.create.mockResolvedValue(expectedUser);
		mockUserRepo.findByEmail.mockResolvedValue(undefined);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = {
				newUserRepository: () => mockUserRepo,
				newFriendshipRepository: () => mock<IFriendshipRepository>(),
				newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
				newPongBallRepository: () => mock<IPongBallRepository>(),
				newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
				newPongClientRepository: () => mock<IPongClientRepository>(),
				newPongLoopRepository: () => mock<IPongLoopRepository>(),
			};
			return callback(repo);
		});

		const usecase = new RegisterUserUsecase(mockTx);
		const input = { email: "test@example.com" };
		const user = await usecase.execute(input);

		expect(user.email).toEqual(expectedUser.email);
	});

	it("should throw BadRequestError if email is already used", async () => {
		const existingUser = User.create(new UserEmail("test@example.com"));
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findByEmail.mockResolvedValue(existingUser);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = {
				newUserRepository: () => mockUserRepo,
				newFriendshipRepository: () => mock<IFriendshipRepository>(),
				newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
				newPongBallRepository: () => mock<IPongBallRepository>(),
				newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
				newPongClientRepository: () => mock<IPongClientRepository>(),
				newPongLoopRepository: () => mock<IPongLoopRepository>(),
			};
			return callback(repo);
		});

		const usecase = new RegisterUserUsecase(mockTx);
		const input = { email: "test@example.com" };

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
	});
});
