import { ErrBadRequest } from "@domain/error";
import type { User } from "@domain/model/user";
import type { BlockUserUsecase } from "@usecase/relationship/block_user_usecase";
import type { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import type { RemoveFriendUsecase } from "@usecase/relationship/remove_friend_usecase";
import type { RespondToFriendRequestUsecase } from "@usecase/relationship/respond_to_friend_request_usecase";
import type { SendFriendRequestUsecase } from "@usecase/relationship/send_friend_request_usecase";
import type { UnblockUserUsecase } from "@usecase/relationship/unblock_user_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const relationshipController = (
	getFriendsUsecase: GetFriendsUsecase,
	sendFriendRequestUsecase: SendFriendRequestUsecase,
	respondToFriendRequestUsecase: RespondToFriendRequestUsecase,
	removeFriendUsecase: RemoveFriendUsecase,
	blockUserUsecase: BlockUserUsecase,
	unblockUserUsecase: UnblockUserUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get("/friends", onGetFriends(getFriendsUsecase));
		fastify.post(
			"/friends/requests",
			onSendFriendRequest(sendFriendRequestUsecase),
		);
		fastify.put(
			"/friends/requests/:requestId",
			onRespondToFriendRequest(respondToFriendRequestUsecase),
		);
		fastify.delete("/friends/:friendId", onRemoveFriend(removeFriendUsecase));
		fastify.post("/blocks", onBlockUser(blockUserUsecase));
		fastify.delete("/blocks/:blockedUserId", onUnblockUser(unblockUserUsecase));
	};
};

/**
 * Userドメインオブジェクトをクライアント向けのJSONオブジェクト（DTO）に変換するヘルパー関数
 */
const toUserDTO = (user: User) => {
	return {
		id: user.id.value,
		email: user.email.value,
		// 必要に応じて他のプロパティも追加
		//例: username: user.username.value,
	};
};

const onGetFriends = (usecase: GetFriendsUsecase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

		const friends = await usecase.execute(userId);

		// 🔽【修正点】ドメインオブジェクトの配列を、DTOの配列に変換
		const responseBody = friends.map(toUserDTO);

		reply.send(responseBody);
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
			const flat = input.error.flatten();
			const details: Record<string, string> = {};
			for (const [key, value] of Object.entries(flat.fieldErrors)) {
				if (value && value.length > 0) details[key] = value.join(", ");
			}
			if (flat.formErrors && flat.formErrors.length > 0) {
				details.formErrors = flat.formErrors.join(", ");
			}
			throw new ErrBadRequest({ details });
		}

		// TODO: セッションからuserIdを取得する
		const requesterId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

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
			const flat = input.error.flatten();
			const details: Record<string, string> = {};
			for (const [key, value] of Object.entries(flat.fieldErrors)) {
				if (value && value.length > 0) details[key] = value.join(", ");
			}
			if (flat.formErrors && flat.formErrors.length > 0) {
				details.formErrors = flat.formErrors.join(", ");
			}
			throw new ErrBadRequest({ details });
		}

		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQMEY074R1XNH3BKR3J17"; // 仮のユーザーID (リクエストを受け取った側)

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
		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

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
			const flat = input.error.flatten();
			const details: Record<string, string> = {};
			for (const [key, value] of Object.entries(flat.fieldErrors)) {
				if (value && value.length > 0) details[key] = value.join(", ");
			}
			if (flat.formErrors && flat.formErrors.length > 0) {
				details.formErrors = flat.formErrors.join(", ");
			}
			throw new ErrBadRequest({ details });
		}

		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

		await usecase.execute({
			blockerId: userId,
			blockedId: input.data.blockedId,
		});
		reply.status(204).send();
	};
};

const onUnblockUser = (usecase: UnblockUserUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { blockedUserId: string } }>,
		reply: FastifyReply,
	) => {
		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

		await usecase.execute({
			blockerId: userId,
			blockedId: req.params.blockedUserId,
		});
		reply.status(204).send();
	};
};
