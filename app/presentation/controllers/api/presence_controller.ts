import type { SessionBasedPresenceService } from "@domain/service/session_based_presence_service";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type {
	GetOnlineUsersUsecase,
	GetUsersOnlineStatusUsecase,
	IsUserOnlineUsecase,
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
	getOnlineUsersUsecase: GetOnlineUsersUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
	isUserOnlineUsecase: IsUserOnlineUsecase,
	authPrehandler: AuthPrehandler,
	presenceService?: SessionBasedPresenceService,
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

		// オフライン状態は自動的にセッション管理で処理されるため、
		// 明示的なofflineエンドポイントは削除

		// ハートビートも自動的にAPIリクエストで処理されるため、
		// 専用のheartbeatエンドポイントは削除

		// デバッグ用：現在のユーザーのオンライン状態を確認
		fastify.get(
			"/presence/my-status",
			{ preHandler: [authPrehandler] },
			async (request, reply) => {
				const userId = request.authenticatedUser?.id;
				if (!userId) {
					return reply.status(401).send({ message: "Unauthorized" });
				}

				const isOnline = await isUserOnlineUsecase.execute(userId);
				return reply.send({
					userId,
					isOnline,
					timestamp: new Date().toISOString(),
				});
			},
		);

		// 全てのオンラインユーザーを取得（セッション統合版）
		fastify.get(
			"/presence/online-users",
			{ preHandler: [authPrehandler] },
			onGetOnlineUsers(getOnlineUsersUsecase, presenceService),
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

// onSetUserOffline と onExtendUserOnline ハンドラーは削除
// 新しいシステムではセッション管理とAPIリクエスト自動追跡で代替

const onGetOnlineUsers = (
	usecase: GetOnlineUsersUsecase,
	presenceService?: SessionBasedPresenceService,
) => {
	return async (_request: FastifyRequest, reply: FastifyReply) => {
		try {
			let onlineUsers: string[];

			if (presenceService) {
				// セッションベースの統合管理を使用
				onlineUsers = await presenceService.getOnlineUsersWithSession();
			} else {
				// 従来のRedisベースのみ使用
				onlineUsers = await usecase.execute();
			}

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
