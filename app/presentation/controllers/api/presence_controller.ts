import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type {
	ExtendUserOnlineUsecase,
	GetOnlineUsersUsecase,
	GetUsersOnlineStatusUsecase,
	IsUserOnlineUsecase,
	SetUserOfflineUsecase,
	SetUserOnlineUsecase,
} from "@usecase/presence";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

// Request/Response types
type GetOnlineUsersResponse = {
	onlineUsers: string[];
};

type GetUsersOnlineStatusRequest = {
	userIds: string[];
};

type GetUsersOnlineStatusResponse = {
	users: Array<{
		userId: string;
		isOnline: boolean;
	}>;
};

type SetUserOnlineRequest = {
	ttl?: number;
};

type GetUserOnlineStatusResponse = {
	userId: string;
	isOnline: boolean;
};

export const presenceController = (
	setUserOnlineUsecase: SetUserOnlineUsecase,
	setUserOfflineUsecase: SetUserOfflineUsecase,
	extendUserOnlineUsecase: ExtendUserOnlineUsecase,
	getOnlineUsersUsecase: GetOnlineUsersUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
	isUserOnlineUsecase: IsUserOnlineUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		// 現在のユーザーをオンライン状態にする
		fastify.post<{
			Body: SetUserOnlineRequest;
		}>(
			"/presence/online",
			{ preHandler: [authPrehandler] },
			onSetUserOnline(setUserOnlineUsecase),
		);

		// 現在のユーザーをオフライン状態にする
		fastify.post(
			"/presence/offline",
			{ preHandler: [authPrehandler] },
			onSetUserOffline(setUserOfflineUsecase),
		);

		// 現在のユーザーのオンライン状態を延長（ハートビート）
		fastify.post<{
			Body: SetUserOnlineRequest;
		}>(
			"/presence/heartbeat",
			{ preHandler: [authPrehandler] },
			onExtendUserOnline(extendUserOnlineUsecase),
		);

		// 全てのオンラインユーザーを取得
		fastify.get(
			"/presence/online-users",
			{ preHandler: [authPrehandler] },
			onGetOnlineUsers(getOnlineUsersUsecase),
		);

		// 複数ユーザーのオンライン状態を一括取得
		fastify.post<{
			Body: GetUsersOnlineStatusRequest;
		}>(
			"/presence/status",
			{ preHandler: [authPrehandler] },
			onGetUsersOnlineStatus(getUsersOnlineStatusUsecase),
		);

		// 特定ユーザーのオンライン状態を取得
		fastify.get<{
			Params: { userId: string };
		}>(
			"/presence/status/:userId",
			{ preHandler: [authPrehandler] },
			onGetUserOnlineStatus(isUserOnlineUsecase),
		);
	};
};

const onSetUserOnline = (usecase: SetUserOnlineUsecase) => {
	return async (
		request: FastifyRequest<{ Body: SetUserOnlineRequest }>,
		reply: FastifyReply,
	) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}

		try {
			await usecase.execute(userId, request.body.ttl);
			return reply.status(200).send({ message: "User set to online" });
		} catch (error) {
			console.error("Failed to set user online:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};

const onSetUserOffline = (usecase: SetUserOfflineUsecase) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}

		try {
			await usecase.execute(userId);
			return reply.status(200).send({ message: "User set to offline" });
		} catch (error) {
			console.error("Failed to set user offline:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};

const onExtendUserOnline = (usecase: ExtendUserOnlineUsecase) => {
	return async (
		request: FastifyRequest<{ Body: SetUserOnlineRequest }>,
		reply: FastifyReply,
	) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}

		try {
			await usecase.execute(userId, request.body.ttl);
			return reply.status(200).send({ message: "User online status extended" });
		} catch (error) {
			console.error("Failed to extend user online status:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};

const onGetOnlineUsers = (usecase: GetOnlineUsersUsecase) => {
	return async (_request: FastifyRequest, reply: FastifyReply) => {
		try {
			const onlineUsers = await usecase.execute();
			const response: GetOnlineUsersResponse = { onlineUsers };
			return reply.status(200).send(response);
		} catch (error) {
			console.error("Failed to get online users:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};

const onGetUsersOnlineStatus = (usecase: GetUsersOnlineStatusUsecase) => {
	return async (
		request: FastifyRequest<{ Body: GetUsersOnlineStatusRequest }>,
		reply: FastifyReply,
	) => {
		try {
			const users = await usecase.execute(request.body.userIds);
			const response: GetUsersOnlineStatusResponse = { users };
			return reply.status(200).send(response);
		} catch (error) {
			console.error("Failed to get users online status:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};

const onGetUserOnlineStatus = (usecase: IsUserOnlineUsecase) => {
	return async (
		request: FastifyRequest<{ Params: { userId: string } }>,
		reply: FastifyReply,
	) => {
		try {
			const userId = request.params.userId;
			const isOnline = await usecase.execute(userId);
			const response: GetUserOnlineStatusResponse = { userId, isOnline };
			return reply.status(200).send(response);
		} catch (error) {
			console.error("Failed to get user online status:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};
