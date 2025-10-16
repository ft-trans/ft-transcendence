import {
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	UserStatusValue,
} from "@domain/model/user";
import { relationshipController } from "@presentation/controllers/relationship_controller";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { GetUsersOnlineStatusUsecase } from "@usecase/presence";
import type { BlockUserUsecase } from "@usecase/relationship/block_user_usecase";
import type { CancelFriendRequestUsecase } from "@usecase/relationship/cancel_friend_request_usecase";
import type { GetBlockedUsersUsecase } from "@usecase/relationship/get_blocked_users_usecase";
import type { GetFriendRequestsUsecase } from "@usecase/relationship/get_friend_requests_usecase";
import type { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import type { GetSentFriendRequestsUsecase } from "@usecase/relationship/get_sent_friend_requests_usecase";
import type { RemoveFriendUsecase } from "@usecase/relationship/remove_friend_usecase";
import type { RespondToFriendRequestUsecase } from "@usecase/relationship/respond_to_friend_request_usecase";
import type { SendFriendRequestUsecase } from "@usecase/relationship/send_friend_request_usecase";
import type { UnblockUserUsecase } from "@usecase/relationship/unblock_user_usecase";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

describe("relationshipController", () => {
	let app: FastifyInstance;
	const getFriendsUsecase = mock<GetFriendsUsecase>();
	const getFriendRequestsUsecase = mock<GetFriendRequestsUsecase>();
	const getSentFriendRequestsUsecase = mock<GetSentFriendRequestsUsecase>();
	const sendFriendRequestUsecase = mock<SendFriendRequestUsecase>();
	const respondToFriendRequestUsecase = mock<RespondToFriendRequestUsecase>();
	const removeFriendUsecase = mock<RemoveFriendUsecase>();
	const cancelFriendRequestUsecase = mock<CancelFriendRequestUsecase>();
	const blockUserUsecase = mock<BlockUserUsecase>();
	const unblockUserUsecase = mock<UnblockUserUsecase>();
	const getBlockedUsersUsecase = mock<GetBlockedUsersUsecase>();
	const getUsersOnlineStatusUsecase = mock<GetUsersOnlineStatusUsecase>();

	// Mock auth prehandler that sets authenticatedUser
	const mockAuthPrehandler: AuthPrehandler = async (request, _reply) => {
		request.authenticatedUser = {
			id: "01K24DQHXAJ2NFYKPZ812F4HBJ",
			email: "test@example.com",
		};
	};

	beforeEach(() => {
		app = Fastify();
		app.register(
			relationshipController(
				getFriendsUsecase,
				getFriendRequestsUsecase,
				getSentFriendRequestsUsecase,
				sendFriendRequestUsecase,
				respondToFriendRequestUsecase,
				removeFriendUsecase,
				cancelFriendRequestUsecase,
				blockUserUsecase,
				unblockUserUsecase,
				getBlockedUsersUsecase,
				getUsersOnlineStatusUsecase,
				mockAuthPrehandler,
			),
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /friends", () => {
		it("should return friends list", async () => {
			const friends = [
				User.reconstruct(
					new UserId("01K24DQHXAJ2NFYKPZ812F4HBC"),
					new UserEmail("friend1@example.com"),
					new Username("friend1"),
					new UserAvatar(""),
					new UserStatusValue("online"),
				),
			];
			getFriendsUsecase.execute.mockResolvedValue(friends);
			getUsersOnlineStatusUsecase.execute.mockResolvedValue([
				{ userId: "01K24DQHXAJ2NFYKPZ812F4HBC", isOnline: true },
			]);

			const response = await app.inject({
				method: "GET",
				url: "/friends",
			});

			const expectedResponseBody = friends.map((f) => ({
				id: f.id.value,
				username: f.username.value,
				avatar: f.avatar.value,
				status: "online", // リアルタイムオンラインステータスが適用される
			}));

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual(expectedResponseBody);

			expect(getFriendsUsecase.execute).toHaveBeenCalledWith(
				"01K24DQHXAJ2NFYKPZ812F4HBJ",
			);
		});
	});

	describe("POST /friends/requests", () => {
		it("should send a friend request and return 204", async () => {
			sendFriendRequestUsecase.execute.mockResolvedValue(undefined);

			const response = await app.inject({
				method: "POST",
				url: "/friends/requests",
				payload: { receiverId: "receiver123" },
			});

			expect(response.statusCode).toBe(204);
			expect(sendFriendRequestUsecase.execute).toHaveBeenCalledWith({
				requesterId: "01K24DQHXAJ2NFYKPZ812F4HBJ",
				receiverId: "receiver123",
			});
		});
	});

	describe("PUT /friends/requests/:requestId", () => {
		it("should respond to a friend request and return 204", async () => {
			respondToFriendRequestUsecase.execute.mockResolvedValue(undefined);

			const response = await app.inject({
				method: "PUT",
				url: "/friends/requests/request123",
				payload: { action: "accept" },
			});

			expect(response.statusCode).toBe(204);
			expect(respondToFriendRequestUsecase.execute).toHaveBeenCalledWith({
				receiverId: "01K24DQHXAJ2NFYKPZ812F4HBJ",
				requesterId: "request123",
				response: "accept",
			});
		});
	});

	describe("DELETE /friends/:friendId", () => {
		it("should remove a friend and return 204", async () => {
			removeFriendUsecase.execute.mockResolvedValue(undefined);

			const response = await app.inject({
				method: "DELETE",
				url: "/friends/friend123",
			});

			expect(response.statusCode).toBe(204);
			expect(removeFriendUsecase.execute).toHaveBeenCalledWith({
				userId: "01K24DQHXAJ2NFYKPZ812F4HBJ",
				friendId: "friend123",
			});
		});
	});

	describe("POST /blocks", () => {
		it("should block a user and return 204", async () => {
			blockUserUsecase.execute.mockResolvedValue(undefined);

			const response = await app.inject({
				method: "POST",
				url: "/blocks",
				payload: { blockedId: "blocked123" },
			});

			expect(response.statusCode).toBe(204);
			expect(blockUserUsecase.execute).toHaveBeenCalledWith({
				blockerId: "01K24DQHXAJ2NFYKPZ812F4HBJ",
				blockedId: "blocked123",
			});
		});
	});

	describe("DELETE /blocks/:blockedUserId", () => {
		it("should unblock a user and return 204", async () => {
			unblockUserUsecase.execute.mockResolvedValue(undefined);

			const response = await app.inject({
				method: "DELETE",
				url: "/blocks/blocked123",
			});

			expect(response.statusCode).toBe(204);
			expect(unblockUserUsecase.execute).toHaveBeenCalledWith({
				blockerId: "01K24DQHXAJ2NFYKPZ812F4HBJ",
				blockedId: "blocked123",
			});
		});
	});
});
