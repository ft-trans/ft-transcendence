import { ErrBadRequest } from "@domain/error";
import type { User } from "@domain/model/user";
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
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const relationshipController = (
	getFriendsUsecase: GetFriendsUsecase,
	getFriendRequestsUsecase: GetFriendRequestsUsecase,
	getSentFriendRequestsUsecase: GetSentFriendRequestsUsecase,
	sendFriendRequestUsecase: SendFriendRequestUsecase,
	respondToFriendRequestUsecase: RespondToFriendRequestUsecase,
	removeFriendUsecase: RemoveFriendUsecase,
	cancelFriendRequestUsecase: CancelFriendRequestUsecase,
	blockUserUsecase: BlockUserUsecase,
	unblockUserUsecase: UnblockUserUsecase,
	getBlockedUsersUsecase: GetBlockedUsersUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/friends",
			{ preHandler: authPrehandler },
			onGetFriends(getFriendsUsecase, getUsersOnlineStatusUsecase),
		);
		fastify.get(
			"/friends/requests/received",
			{ preHandler: authPrehandler },
			onGetFriendRequests(getFriendRequestsUsecase),
		);
		fastify.get(
			"/friends/requests/sent",
			{ preHandler: authPrehandler },
			onGetSentFriendRequests(getSentFriendRequestsUsecase),
		);
		fastify.post(
			"/friends/requests",
			{ preHandler: authPrehandler },
			onSendFriendRequest(sendFriendRequestUsecase),
		);
		fastify.put(
			"/friends/requests/:requestId",
			{ preHandler: authPrehandler },
			onRespondToFriendRequest(respondToFriendRequestUsecase),
		);
		fastify.delete(
			"/friends/:friendId",
			{ preHandler: authPrehandler },
			onRemoveFriend(removeFriendUsecase),
		);
		fastify.delete(
			"/friends/requests/:receiverId",
			{ preHandler: authPrehandler },
			onCancelFriendRequest(cancelFriendRequestUsecase),
		);
		fastify.get(
			"/blocks",
			{ preHandler: authPrehandler },
			onGetBlockedUsers(getBlockedUsersUsecase),
		);
		fastify.post(
			"/blocks",
			{ preHandler: authPrehandler },
			onBlockUser(blockUserUsecase),
		);
		fastify.delete(
			"/blocks/:blockedUserId",
			{ preHandler: authPrehandler },
			onUnblockUser(unblockUserUsecase),
		);
	};
};

/**
 * Zod validation error handling helper function
 */
const handleValidationError = (parseError: z.ZodError) => {
	const flat = parseError.flatten();
	const details: Record<string, string> = {};
	for (const [key, value] of Object.entries(flat.fieldErrors)) {
		if (Array.isArray(value) && value.length > 0) {
			details[key] = value.join(", ");
		}
	}
	if (flat.formErrors && flat.formErrors.length > 0) {
		details.formErrors = flat.formErrors.join(", ");
	}
	throw new ErrBadRequest({ details });
};

/**
 * Userドメインオブジェクトをクライアント向けのJSONオブジェクト（DTO）に変換するヘルパー関数
 */
const toUserDTO = (user: User, isOnline?: boolean) => {
	return {
		id: user.id.value,
		username: user.username.value,
		avatar: user.avatar.value,
		status:
			isOnline !== undefined
				? isOnline
					? "online"
					: "offline"
				: user.status.value,
	};
};

const onGetFriends = (
	usecase: GetFriendsUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			const userId = req.authenticatedUser?.id;
			const friends = await usecase.execute(userId);

			// 友達のオンラインステータスを取得
			const friendIds = friends.map((friend) => friend.id.value);
			const onlineStatusList =
				await getUsersOnlineStatusUsecase.execute(friendIds);
			const onlineStatusMap = new Map(
				onlineStatusList.map((status) => [status.userId, status.isOnline]),
			);

			const responseBody = friends.map((friend) =>
				toUserDTO(friend, onlineStatusMap.get(friend.id.value)),
			);

			// レスポンスが既に送信されていないかチェック
			if (!reply.sent) {
				return reply.send(responseBody);
			}
		} catch (error) {
			console.error("[ERROR] GetFriends failed:", error);
			if (!reply.sent) {
				return reply.status(500).send({ error: "Internal server error" });
			}
		}
	};
};

const onGetFriendRequests = (usecase: GetFriendRequestsUsecase) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			const userId = req.authenticatedUser?.id;
			const friendRequests = await usecase.execute(userId);
			const responseBody = friendRequests.map((request) => ({
				id: `${request.requesterId.value}_${request.receiverId.value}`,
				requesterId: request.requesterId.value,
				receiverId: request.receiverId.value,
				status: request.status,
			}));

			if (!reply.sent) {
				return reply.send(responseBody);
			}
		} catch (error) {
			console.error("[ERROR] GetFriendRequests failed:", error);
			if (!reply.sent) {
				return reply.status(500).send({ error: "Internal server error" });
			}
		}
	};
};

const onGetSentFriendRequests = (usecase: GetSentFriendRequestsUsecase) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			const userId = req.authenticatedUser?.id;
			const sentRequests = await usecase.execute(userId);
			const responseBody = sentRequests.map((request) => ({
				id: `${request.requesterId.value}_${request.receiverId.value}`,
				requesterId: request.requesterId.value,
				receiverId: request.receiverId.value,
				status: request.status,
			}));

			if (!reply.sent) {
				return reply.send(responseBody);
			}
		} catch (error) {
			console.error("[ERROR] GetSentFriendRequests failed:", error);
			if (!reply.sent) {
				return reply.status(500).send({ error: "Internal server error" });
			}
		}
	};
};

const sendFriendRequestSchema = z.object({
	receiverId: z.string(),
});

const onSendFriendRequest = (usecase: SendFriendRequestUsecase) => {
	return async (
		req: FastifyRequest<{ Body: z.infer<typeof sendFriendRequestSchema> }>,
		reply: FastifyReply,
	) => {
		const input = sendFriendRequestSchema.safeParse(req.body);
		if (!input.success) {
			handleValidationError(input.error);
		}

		const requesterId = req.authenticatedUser?.id;

		await usecase.execute({
			requesterId,
			receiverId: input.data.receiverId,
		});
		reply.status(204).send();
	};
};

const respondToFriendRequestSchema = z.object({
	action: z.enum(["accept", "reject"]),
});

const onRespondToFriendRequest = (usecase: RespondToFriendRequestUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { requestId: string };
			Body: z.infer<typeof respondToFriendRequestSchema>;
		}>,
		reply: FastifyReply,
	) => {
		const input = respondToFriendRequestSchema.safeParse(req.body);
		if (!input.success) {
			handleValidationError(input.error);
		}

		const userId = req.authenticatedUser?.id;

		await usecase.execute({
			receiverId: userId,
			requesterId: req.params.requestId,
			response: input.data.action,
		});
		reply.status(204).send();
	};
};

const onRemoveFriend = (usecase: RemoveFriendUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { friendId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;

		await usecase.execute({
			userId,
			friendId: req.params.friendId,
		});
		reply.status(204).send();
	};
};

const blockUserSchema = z.object({
	blockedId: z.string(),
});

const onBlockUser = (usecase: BlockUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: z.infer<typeof blockUserSchema> }>,
		reply: FastifyReply,
	) => {
		const input = blockUserSchema.safeParse(req.body);
		if (!input.success) {
			handleValidationError(input.error);
		}

		const userId = req.authenticatedUser?.id;

		await usecase.execute({
			blockerId: userId,
			blockedId: input.data.blockedId,
		});
		reply.status(204).send();
	};
};

const onCancelFriendRequest = (usecase: CancelFriendRequestUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { receiverId: string } }>,
		reply: FastifyReply,
	) => {
		const requesterId = req.authenticatedUser?.id;

		await usecase.execute({
			requesterId,
			receiverId: req.params.receiverId,
		});
		reply.status(204).send();
	};
};

const onGetBlockedUsers = (usecase: GetBlockedUsersUsecase) => {
	return async (
		req: FastifyRequest,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;

		const blockedUsers = await usecase.execute({
			blockerId: userId,
		});

		reply.send(blockedUsers.map(user => ({
			id: user.id.value,
			email: user.email.value,
			username: user.username.value,
			avatar: user.avatar?.value || null,
		})));
	};
};

const onUnblockUser = (usecase: UnblockUserUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { blockedUserId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;

		await usecase.execute({
			blockerId: userId,
			blockedId: req.params.blockedUserId,
		});
		reply.status(204).send();
	};
};
