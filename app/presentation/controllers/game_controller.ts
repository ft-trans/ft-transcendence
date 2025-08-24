import { ErrBadRequest } from "@domain/error";
import {
	type InviteToGameRequest,
	inviteToGameRequestSchema,
	type JoinMatchmakingRequest,
	joinPrivateMatchRequestSchema,
	type LeaveMatchmakingRequest,
} from "@shared/api/game";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// TODO: Replace with actual use cases
type PlaceholderUsecase = { execute: (...args: unknown[]) => Promise<unknown> };
const createPlaceholderUsecase = (): PlaceholderUsecase => ({
	execute: async () => {
		/* placeholder */
	},
});

export const gameController = (
	joinMatchmakingUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	leaveMatchmakingUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	inviteToGameUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
	joinPrivateMatchUsecase: PlaceholderUsecase = createPlaceholderUsecase(),
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post(
			"/game/matchmaking/join",
			onJoinMatchmaking(joinMatchmakingUsecase),
		);
		fastify.post(
			"/game/matchmaking/leave",
			onLeaveMatchmaking(leaveMatchmakingUsecase),
		);
		fastify.post("/game/invite", onInviteToGame(inviteToGameUsecase));
		fastify.post(
			"/game/join/:inviteCode",
			onJoinPrivateMatch(joinPrivateMatchUsecase),
		);
	};
};

const onJoinMatchmaking = (usecase: PlaceholderUsecase) => {
	return async (
		_req: FastifyRequest<{ Body: JoinMatchmakingRequest }>,
		reply: FastifyReply,
	) => {
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ userId });
		reply.send({});
	};
};

const onLeaveMatchmaking = (usecase: PlaceholderUsecase) => {
	return async (
		_req: FastifyRequest<{ Body: LeaveMatchmakingRequest }>,
		reply: FastifyReply,
	) => {
		// TODO: Get userId from session
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // Mock user ID
		await usecase.execute({ userId });
		reply.send({});
	};
};

const onInviteToGame = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Body: InviteToGameRequest }>,
		reply: FastifyReply,
	) => {
		const input = inviteToGameRequestSchema.safeParse(req.body);
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
		const inviteCode = await usecase.execute({
			requesterId,
			userId: input.data.userId,
		});
		reply.send({ inviteCode });
	};
};

const onJoinPrivateMatch = (usecase: PlaceholderUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { inviteCode: string } }>,
		reply: FastifyReply,
	) => {
		const input = joinPrivateMatchRequestSchema.safeParse({
			inviteCode: req.params.inviteCode,
		});
		if (!input.success) {
			throw new ErrBadRequest({
				userMessage: "Invalid invite code",
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
		await usecase.execute({ userId, inviteCode: input.data.inviteCode });
		reply.send({});
	};
};
