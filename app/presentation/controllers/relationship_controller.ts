import { ErrBadRequest } from "@domain/error";
import {
	type BlockUserRequest,
	blockUserRequestSchema,
	type RespondToFriendRequestRequest,
	respondToFriendRequestSchema,
	type SendFriendRequestRequest,
	sendFriendRequestSchema,
} from "@shared/api/relationship";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// TODO: Replace with actual use cases
type PlaceholderUsecase = { execute: (...args: unknown[]) => Promise<unknown> };
const createPlaceholderUsecase = (): PlaceholderUsecase => ({
	execute: async () => {
		/* placeholder */
		return [];
	},
});

export const relationshipController = (
	getFriendsUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	sendFriendRequestUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	respondToFriendRequestUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	removeFriendUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	blockUserUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	unblockUserUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get("/relationships/friends", onGetFriends(getFriendsUsecase));
		fastify.post(
			"/relationships/friends",
			onSendFriendRequest(sendFriendRequestUsecase),
		);
		fastify.put(
			"/relationships/friends/:userId",
			onRespondToFriendRequest(respondToFriendRequestUsecase),
		);
		fastify.delete(
			"/relationships/friends/:userId",
			onRemoveFriend(removeFriendUsecase),
		);
		fastify.post("/relationships/blocks", onBlockUser(blockUserUsecase));
		fastify.delete(
			"/relationships/blocks/:userId",
			onUnblockUser(unblockUserUsecase),
		);
	};
};

import type { User } from "@domain/model/user";

// ... (imports)

// ... (other code)

const onGetFriends = (usecase: PlaceholderUsecase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		const friends = (await usecase.execute({ userId })) as User[];
		reply.send({ friends: friends.map(serializeUser) });
	};
};

const serializeUser = (user: User) => ({
	id: user.id.value,
	email: user.email.value,
});

// ... (other code)

const onSendFriendRequest = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Body: SendFriendRequestRequest }>,
		reply: FastifyReply,
	) => {
		const input = sendFriendRequestSchema.safeParse(req.body);
		if (!input.success) {
			throw new ErrBadRequest({
				userMessage: "Invalid request body",
				details: Object.fromEntries(
					Object.entries(input.error.flatten().fieldErrors).map(([k, v]) => [
						k,
						v?.join(", ") ?? "",
					]),
				),
			});
		}
		// TODO: Get userId from session
		const requesterId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ requesterId, addresseeId: input.data.userId });
		reply.send({});
	};
};

const onRespondToFriendRequest = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{
			Body: RespondToFriendRequestRequest;
			Params: { userId: string };
		}>,
		reply: FastifyReply,
	) => {
		const input = respondToFriendRequestSchema.safeParse(req.body);
		if (!input.success) {
			throw new ErrBadRequest({
				userMessage: "Invalid request body",
				details: Object.fromEntries(
					Object.entries(input.error.flatten().fieldErrors).map(([k, v]) => [
						k,
						v?.join(", ") ?? "",
					]),
				),
			});
		}
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({
			userId,
			requesterId: req.params.userId,
			status: input.data.status,
		});
		reply.send({});
	};
};

const onRemoveFriend = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { userId: string } }>,
		reply: FastifyReply,
	) => {
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ userId, friendId: req.params.userId });
		reply.send({});
	};
};

const onBlockUser = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Body: BlockUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = blockUserRequestSchema.safeParse(req.body);
		if (!input.success) {
			throw new ErrBadRequest({
				userMessage: "Invalid request body",
				details: Object.fromEntries(
					Object.entries(input.error.flatten().fieldErrors).map(([k, v]) => [
						k,
						v?.join(", ") ?? "",
					]),
				),
			});
		}
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ userId, blockUserId: input.data.userId });
		reply.send({});
	};
};

const onUnblockUser = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { userId: string } }>,
		reply: FastifyReply,
	) => {
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ userId, unblockUserId: req.params.userId });
		reply.send({});
	};
};
