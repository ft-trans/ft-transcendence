// ==> app/usecase/relationship/relationship_usecase.spec.ts <==
import { ErrBadRequest, ErrForbidden, ErrNotFound } from "@domain/error";
import { Friendship } from "@domain/model/friendship";
import { User, UserEmail } from "@domain/model/user";
import type { IDirectMessageRepository } from "@domain/repository/direct_message_repository";
import type { IFriendshipRepository } from "@domain/repository/friendship_repository";
import type { ISessionRepository } from "@domain/repository/session_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { BlockUserUsecase } from "./block_user_usecase";
import { GetFriendsUsecase } from "./get_friends_usecase";
import { RemoveFriendUsecase } from "./remove_friend_usecase";
import { RespondToFriendRequestUsecase } from "./respond_to_friend_request_usecase";
import { SendFriendRequestUsecase } from "./send_friend_request_usecase";
import { UnblockUserUsecase } from "./unblock_user_usecase";

// --- Common Mocks & Setup ---
const userRepo = mock<IUserRepository>();
const friendshipRepo = mock<IFriendshipRepository>();
const directMessageRepo = mock<IDirectMessageRepository>();
const tx = mock<ITransaction>();

// トランザクションのモック実装
const mockRepos = {
	newUserRepository: () => userRepo,
	newFriendshipRepository: () => friendshipRepo,
	newDirectMessageRepository: () => directMessageRepo,
	newSessionRepository: () => mock<ISessionRepository>(),
};
tx.exec.mockImplementation(async (callback) => callback(mockRepos));

// 各テストの前にモックをクリア
beforeEach(() => {
	vi.clearAllMocks();
});

// --- Test Suites ---

describe("SendFriendRequestUsecase", () => {
	const usecase = new SendFriendRequestUsecase(tx);
	const requester = User.create(new UserEmail("requester@example.com"));
	const receiver = User.create(new UserEmail("receiver@example.com"));

	it("should create a pending friendship when no relationship exists", async () => {
		userRepo.findById
			.mockResolvedValueOnce(requester)
			.mockResolvedValueOnce(receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(undefined);

		await usecase.execute({
			requesterId: requester.id.value,
			receiverId: receiver.id.value,
		});

		expect(friendshipRepo.save).toHaveBeenCalledOnce();
		expect(friendshipRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({
				requesterId: requester.id,
				receiverId: receiver.id,
				status: "pending",
			}),
		);
	});

	it("should throw BadRequestError if friendship already exists", async () => {
		const existingFriendship = Friendship.create(requester, receiver);
		userRepo.findById
			.mockResolvedValueOnce(requester)
			.mockResolvedValueOnce(receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(existingFriendship);

		await expect(
			usecase.execute({
				requesterId: requester.id.value,
				receiverId: receiver.id.value,
			}),
		).rejects.toThrow(ErrBadRequest);
	});

	it("should throw BadRequestError when sending a request to oneself", async () => {
		await expect(
			usecase.execute({
				requesterId: requester.id.value,
				receiverId: requester.id.value,
			}),
		).rejects.toThrow(ErrBadRequest);
	});

	it("should throw NotFoundError if receiver does not exist", async () => {
		userRepo.findById
			.mockResolvedValueOnce(requester)
			.mockResolvedValueOnce(undefined);
		await expect(
			usecase.execute({
				requesterId: requester.id.value,
				receiverId: ulid(),
			}),
		).rejects.toThrow(ErrNotFound);
	});

	it("should throw ForbiddenError if requester is blocked by receiver", async () => {
		const friendship = Friendship.create(receiver, requester);
		friendship.status = "blocked";
		userRepo.findById
			.mockResolvedValueOnce(requester)
			.mockResolvedValueOnce(receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await expect(
			usecase.execute({
				requesterId: requester.id.value,
				receiverId: receiver.id.value,
			}),
		).rejects.toThrow(ErrForbidden);
	});

	it("should throw ForbiddenError if receiver is blocked by requester", async () => {
		const friendship = Friendship.create(requester, receiver);
		friendship.status = "blocked";
		userRepo.findById
			.mockResolvedValueOnce(requester)
			.mockResolvedValueOnce(receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await expect(
			usecase.execute({
				requesterId: requester.id.value,
				receiverId: receiver.id.value,
			}),
		).rejects.toThrow(ErrForbidden);
	});
});

describe("RespondToFriendRequestUsecase", () => {
	const usecase = new RespondToFriendRequestUsecase(tx);
	const requester = User.create(new UserEmail("requester@example.com"));
	const receiver = User.create(new UserEmail("receiver@example.com"));
	const otherUser = User.create(new UserEmail("other@example.com"));

	it("should accept a pending friend request", async () => {
		const pendingFriendship = Friendship.create(requester, receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(pendingFriendship);

		await usecase.execute({
			receiverId: receiver.id.value,
			requesterId: requester.id.value,
			response: "accept",
		});

		expect(friendshipRepo.save).toHaveBeenCalledOnce();
		expect(friendshipRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({ status: "accepted" }),
		);
	});

	it("should reject and delete a pending friend request", async () => {
		const pendingFriendship = Friendship.create(requester, receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(pendingFriendship);

		await usecase.execute({
			receiverId: receiver.id.value,
			requesterId: requester.id.value,
			response: "reject",
		});

		expect(friendshipRepo.delete).toHaveBeenCalledOnce();
		expect(friendshipRepo.delete).toHaveBeenCalledWith(pendingFriendship);
	});

	it("should throw NotFoundError if the friend request does not exist", async () => {
		friendshipRepo.findByUserIds.mockResolvedValue(null);
		await expect(
			usecase.execute({
				receiverId: receiver.id.value,
				requesterId: requester.id.value,
				response: "accept",
			}),
		).rejects.toThrow(ErrNotFound);
	});

	it("should throw ForbiddenError if the request is not pending", async () => {
		const acceptedFriendship = Friendship.create(requester, receiver);
		acceptedFriendship.accept();
		friendshipRepo.findByUserIds.mockResolvedValue(acceptedFriendship);

		await expect(
			usecase.execute({
				receiverId: receiver.id.value,
				requesterId: requester.id.value,
				response: "accept",
			}),
		).rejects.toThrow(ErrForbidden);
	});

	it("should throw ForbiddenError if a user other than the receiver tries to respond", async () => {
		const pendingFriendship = Friendship.create(requester, receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(pendingFriendship);

		await expect(
			usecase.execute({
				receiverId: otherUser.id.value, // Wrong user
				requesterId: requester.id.value,
				response: "accept",
			}),
		).rejects.toThrow(ErrForbidden);
	});
});

describe("GetFriendsUsecase", () => {
	const usecase = new GetFriendsUsecase(tx);
	const user = User.create(new UserEmail("user@example.com"));
	const friend1 = User.create(new UserEmail("friend1@example.com"));
	const friend2 = User.create(new UserEmail("friend2@example.com"));

	it("should return a list of friends", async () => {
		userRepo.findById.mockResolvedValue(user);
		friendshipRepo.findFriendsByUserId.mockResolvedValue([friend1, friend2]);

		const friends = await usecase.execute(user.id.value);

		expect(friends).toHaveLength(2);
		expect(friends).toEqual(expect.arrayContaining([friend1, friend2]));
	});

	it("should return an empty list if the user has no friends", async () => {
		userRepo.findById.mockResolvedValue(user);
		friendshipRepo.findFriendsByUserId.mockResolvedValue([]);

		const friends = await usecase.execute(user.id.value);
		expect(friends).toHaveLength(0);
	});

	it("should throw NotFoundError if the user does not exist", async () => {
		userRepo.findById.mockResolvedValue(undefined);
		await expect(usecase.execute(ulid())).rejects.toThrow(ErrNotFound);
	});
});

describe("RemoveFriendUsecase", () => {
	const usecase = new RemoveFriendUsecase(tx);
	const user = User.create(new UserEmail("user@example.com"));
	const friend = User.create(new UserEmail("friend@example.com"));

	it("should remove a friend successfully", async () => {
		const friendship = Friendship.create(user, friend);
		friendship.accept();
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await usecase.execute({
			userId: user.id.value,
			friendId: friend.id.value,
		});

		expect(friendshipRepo.delete).toHaveBeenCalledWith(friendship);
	});

	it("should throw NotFoundError if the friendship does not exist", async () => {
		friendshipRepo.findByUserIds.mockResolvedValue(null);
		await expect(
			usecase.execute({ userId: user.id.value, friendId: friend.id.value }),
		).rejects.toThrow(ErrNotFound);
	});

	it("should throw NotFoundError if the friendship is pending, not accepted", async () => {
		const friendship = Friendship.create(user, friend); // status is 'pending'
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);
		await expect(
			usecase.execute({ userId: user.id.value, friendId: friend.id.value }),
		).rejects.toThrow(ErrNotFound);
	});
});

describe("BlockUserUsecase", () => {
	const usecase = new BlockUserUsecase(tx);
	const blocker = User.create(new UserEmail("blocker@example.com"));
	const blocked = User.create(new UserEmail("blocked@example.com"));

	it("should create a new relationship with 'blocked' status", async () => {
		userRepo.findById
			.mockResolvedValueOnce(blocker)
			.mockResolvedValueOnce(blocked);
		friendshipRepo.findByUserIds.mockResolvedValue(undefined);

		await usecase.execute({
			blockerId: blocker.id.value,
			blockedId: blocked.id.value,
		});

		expect(friendshipRepo.save).toHaveBeenCalledOnce();
		expect(friendshipRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({ status: "blocked" }),
		);
	});

	it("should update an existing friendship to 'blocked'", async () => {
		const friendship = Friendship.create(blocker, blocked);
		friendship.accept();
		userRepo.findById
			.mockResolvedValueOnce(blocker)
			.mockResolvedValueOnce(blocked);
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await usecase.execute({
			blockerId: blocker.id.value,
			blockedId: blocked.id.value,
		});

		expect(friendshipRepo.save).toHaveBeenCalledOnce();
		expect(friendshipRepo.save).toHaveBeenCalledWith(
			expect.objectContaining({ status: "blocked" }),
		);
	});

	it("should not do anything if user is already blocked", async () => {
		const friendship = Friendship.create(blocker, blocked);
		friendship.status = "blocked";
		userRepo.findById
			.mockResolvedValueOnce(blocker)
			.mockResolvedValueOnce(blocked);
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await usecase.execute({
			blockerId: blocker.id.value,
			blockedId: blocked.id.value,
		});

		expect(friendshipRepo.save).not.toHaveBeenCalled();
	});

	it("should throw BadRequestError when blocking oneself", async () => {
		await expect(
			usecase.execute({
				blockerId: blocker.id.value,
				blockedId: blocker.id.value,
			}),
		).rejects.toThrow(ErrBadRequest);
	});

	it("should throw NotFoundError if blocked user does not exist", async () => {
		userRepo.findById
			.mockResolvedValueOnce(blocker)
			.mockResolvedValueOnce(undefined);
		await expect(
			usecase.execute({
				blockerId: blocker.id.value,
				blockedId: ulid(),
			}),
		).rejects.toThrow(ErrNotFound);
	});
});

describe("UnblockUserUsecase", () => {
	const usecase = new UnblockUserUsecase(tx);
	const blocker = User.create(new UserEmail("blocker@example.com"));
	const blocked = User.create(new UserEmail("blocked@example.com"));
	const otherUser = User.create(new UserEmail("other@example.com"));

	it("should unblock a user by deleting the relationship", async () => {
		const friendship = Friendship.create(blocker, blocked);
		friendship.status = "blocked";
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await usecase.execute({
			blockerId: blocker.id.value,
			blockedId: blocked.id.value,
		});

		expect(friendshipRepo.delete).toHaveBeenCalledWith(friendship);
	});

	it("should throw NotFoundError if no block relationship exists", async () => {
		friendshipRepo.findByUserIds.mockResolvedValue(null);
		await expect(
			usecase.execute({
				blockerId: blocker.id.value,
				blockedId: blocked.id.value,
			}),
		).rejects.toThrow(ErrNotFound);
	});

	it("should throw NotFoundError if the relationship is not 'blocked'", async () => {
		const friendship = Friendship.create(blocker, blocked);
		friendship.accept();
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await expect(
			usecase.execute({
				blockerId: blocker.id.value,
				blockedId: blocked.id.value,
			}),
		).rejects.toThrow(ErrNotFound);
	});

	it("should throw NotFoundError if a user other than the blocker tries to unblock", async () => {
		const friendship = Friendship.create(blocker, blocked);
		friendship.status = "blocked";
		friendshipRepo.findByUserIds.mockResolvedValue(friendship);

		await expect(
			usecase.execute({
				blockerId: otherUser.id.value, // Wrong user
				blockedId: blocked.id.value,
			}),
		).rejects.toThrow(ErrNotFound);
	});
});
