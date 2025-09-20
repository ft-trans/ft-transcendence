import { relationshipController } from "@presentation/controllers/relationship_controller";
import type { BlockUserUsecase } from "@usecase/relationship/block_user_usecase";
import type { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import type { RemoveFriendUsecase } from "@usecase/relationship/remove_friend_usecase";
import type { RespondToFriendRequestUsecase } from "@usecase/relationship/respond_to_friend_request_usecase";
import type { SendFriendRequestUsecase } from "@usecase/relationship/send_friend_request_usecase";
import type { UnblockUserUsecase } from "@usecase/relationship/unblock_user_usecase";
import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { User, UserId, UserEmail } from "@domain/model/user";

describe("relationshipController", () => {
	let app: FastifyInstance;
	const getFriendsUsecase = mock<GetFriendsUsecase>();
	const sendFriendRequestUsecase = mock<SendFriendRequestUsecase>();
	const respondToFriendRequestUsecase = mock<RespondToFriendRequestUsecase>();
	const removeFriendUsecase = mock<RemoveFriendUsecase>();
	const blockUserUsecase = mock<BlockUserUsecase>();
	const unblockUserUsecase = mock<UnblockUserUsecase>();

	beforeEach(() => {
		app = Fastify();
		app.register(
			relationshipController(
				getFriendsUsecase,
				sendFriendRequestUsecase,
				respondToFriendRequestUsecase,
				removeFriendUsecase,
				blockUserUsecase,
				unblockUserUsecase,
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
					new UserEmail("friend1@example.com")
				),
			];
			getFriendsUsecase.execute.mockResolvedValue(friends);

			const response = await app.inject({
				method: "GET",
				url: "/friends",
			});
            
			const expectedResponseBody = friends.map(f => ({
				id: f.id.value,
				email: f.email.value,
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
				receiverId: "01K24DQMEY074R1XNH3BKR3J17",
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
