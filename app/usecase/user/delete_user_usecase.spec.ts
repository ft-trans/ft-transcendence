// ==> app/usecase/user/delete_user_usecase.spec.ts <==
import { ErrNotFound } from "@domain/error";
import { User, UserEmail } from "@domain/model";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	ISessionRepository,
	IUserRepository,
} from "@domain/repository";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { DeleteUserUsecase } from "./delete_user_usecase";

describe("DeleteUserUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should delete a user and return it", async () => {
		const currentUser = User.create(new UserEmail("current@example.com"));
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.delete.mockResolvedValue(currentUser);
		mockUserRepo.findById.mockResolvedValue(currentUser);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = {
				newUserRepository: () => mockUserRepo,
				newFriendshipRepository: () => mock<IFriendshipRepository>(),
				newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
				newSessionRepository: () => mock<ISessionRepository>(),
			};
			return callback(repo);
		});

		const usecase = new DeleteUserUsecase(mockTx);
		const input = { id: currentUser.id.value };
		const user = await usecase.execute(input);

		expect(user.email).toEqual(currentUser.email);
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});

	it("should throw NotFoundError if user does not exist", async () => {
		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.delete.mockResolvedValue(undefined);
		mockUserRepo.findById.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = {
				newUserRepository: () => mockUserRepo,
				newFriendshipRepository: () => mock<IFriendshipRepository>(),
				newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
				newSessionRepository: () => mock<ISessionRepository>(),
			};
			return callback(repo);
		});

		const usecase = new DeleteUserUsecase(mockTx);
		const input = { id: ulid() };

		await expect(usecase.execute(input)).rejects.toThrow(ErrNotFound);
		expect(mockUserRepo.delete).not.toHaveBeenCalled();
		expect(mockTx.exec).toHaveBeenCalledOnce();
	});
});
