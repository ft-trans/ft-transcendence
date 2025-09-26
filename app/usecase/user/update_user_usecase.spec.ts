// ==> app/usecase/user/update_user_usecase.spec.ts <==
import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { User, UserEmail } from "@domain/model";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongMatchStateRepository,
	IPongPaddleRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { UpdateUserUsecase } from "./update_user_usecase";

const mockUserRepo = mock<IUserRepository>();
const repo = {
	newUserRepository: () => mockUserRepo,
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newPongClientRepository: () => mock<IPongClientRepository>(),
	newPongLoopRepository: () => mock<IPongLoopRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
};

const mockTx = mock<ITransaction>();
mockTx.exec.mockImplementation(async (callback) => {
	return callback(repo);
});

describe("UpdateUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should update a user and return it", async () => {
		const currentUser = User.create(new UserEmail("current@example.com"));
		const expectedUser = User.create(new UserEmail("edit@example.com"));
		mockUserRepo.update.mockResolvedValue(expectedUser);
		mockUserRepo.findById.mockResolvedValue(currentUser);
		mockUserRepo.findByEmail.mockResolvedValue(undefined);
		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			return callback(repo);
		});

		const usecase = new UpdateUserUsecase(mockTx);
		const input = { id: currentUser.id.value, email: "edit@example.com" };
		const user = await usecase.execute(input);

		expect(user.email).toEqual(expectedUser.email);
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});

	it("should return current user without update when no changes", async () => {
		const currentUser = User.create(new UserEmail("same@example.com"));
		mockUserRepo.findById.mockResolvedValue(currentUser);
		// don't call update
		mockUserRepo.update.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			return callback(repo);
		});

		const usecase = new UpdateUserUsecase(mockTx);
		const input = { id: currentUser.id.value, email: currentUser.email.value };
		const user = await usecase.execute(input);

		expect(user).toBe(currentUser);
		expect(mockUserRepo.update).not.toHaveBeenCalled();
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});

	it("should throw BadRequestError if email is already used", async () => {
		const currentUser = User.create(new UserEmail("current@example.com"));
		const existingUser = User.create(new UserEmail("edit@example.com"));

		mockUserRepo.findById.mockResolvedValue(currentUser);
		mockUserRepo.findByEmail.mockResolvedValue(existingUser);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			return callback(repo);
		});

		const usecase = new UpdateUserUsecase(mockTx);
		const input = { id: currentUser.id.value, email: existingUser.email.value };

		await expect(usecase.execute(input)).rejects.toThrowError(
			new ErrBadRequest({
				details: {
					userEmail: "メールアドレスは既に使用されています",
				},
			}),
		);
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});

	it("should throw NotFoundError if user does not exist", async () => {
		mockUserRepo.findById.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			return callback(repo);
		});

		const usecase = new UpdateUserUsecase(mockTx);
		const input = { id: ulid(), email: "edit@example.com" };

		await expect(usecase.execute(input)).rejects.toThrowError(
			new ErrNotFound(),
		);
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});
});
