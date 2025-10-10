import type { User } from "@domain/model/user";
import { UserId } from "@domain/model/user";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { GetMatchStatsUseCase } from "@usecase/game/get_match_stats_usecase";
import type { GetUsersOnlineStatusUsecase } from "@usecase/presence";
import type { FindUserByUsernameUsecase } from "@usecase/user/find_user_by_username_usecase";
import type { FindUserUsecase } from "@usecase/user/find_user_usecase";
import type { SearchUsersUsecase } from "@usecase/user/search_users_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const userController = (
	searchUsersUsecase: SearchUsersUsecase,
	findUserUsecase: FindUserUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
	findUserByUsernameUsecase: FindUserByUsernameUsecase,
	getMatchStatsUseCase: GetMatchStatsUseCase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/users",
			{ preHandler: authPrehandler },
			onSearchUsers(searchUsersUsecase, getUsersOnlineStatusUsecase),
		);
		fastify.get(
			"/users/:userId",
			{ preHandler: authPrehandler },
			onGetUser(findUserUsecase, getUsersOnlineStatusUsecase),
		);
		fastify.get(
			"/users/username/:username",
			onFindUserByUsername(findUserByUsernameUsecase),
		);
		fastify.get("/users/:userId/stats", onGetUserStats(getMatchStatsUseCase));
	};
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

const onSearchUsers = (
	usecase: SearchUsersUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
) => {
	return async (
		req: FastifyRequest<{
			Querystring: { q?: string; limit?: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const searchQuery = req.query.q;
			const limit = req.query.limit ? Number.parseInt(req.query.limit) : 50;
			const excludeUserId = req.authenticatedUser?.id;

			const users = await usecase.execute({
				searchQuery,
				excludeUserId,
				limit,
			});

			// ユーザーのオンラインステータスを取得
			const userIds = users.map((user) => user.id.value);
			const onlineStatusList =
				await getUsersOnlineStatusUsecase.execute(userIds);
			const onlineStatusMap = new Map(
				onlineStatusList.map((status) => [status.userId, status.isOnline]),
			);

			const responseBody = users.map((user) =>
				toUserDTO(user, onlineStatusMap.get(user.id.value)),
			);

			if (!reply.sent) {
				return reply.send(responseBody);
			}
		} catch (error) {
			console.error("[ERROR] SearchUsers failed:", error);
			if (!reply.sent) {
				return reply.status(500).send({ error: "Internal server error" });
			}
		}
	};
};

const onGetUser = (
	usecase: FindUserUsecase,
	getUsersOnlineStatusUsecase: GetUsersOnlineStatusUsecase,
) => {
	return async (
		req: FastifyRequest<{
			Params: { userId: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const { userId } = req.params;
			const userIdObj = new UserId(userId);
			const user = await usecase.run(userIdObj);

			// ユーザーのオンラインステータスを取得
			const onlineStatusList = await getUsersOnlineStatusUsecase.execute([
				userId,
			]);
			const isOnline =
				onlineStatusList.length > 0 ? onlineStatusList[0].isOnline : false;

			const responseBody = toUserDTO(user, isOnline);

			if (!reply.sent) {
				return reply.send(responseBody);
			}
		} catch (error) {
			console.error("[ERROR] GetUser failed:", error);
			if (!reply.sent) {
				return reply.status(404).send({ error: "User not found" });
			}
		}
	};
};

const onFindUserByUsername = (usecase: FindUserByUsernameUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { username: string };
		}>,
		reply: FastifyReply,
	) => {
		const user = await usecase.exec(req.params.username);
		return reply.send(toUserDTO(user));
	};
};

const onGetUserStats = (usecase: GetMatchStatsUseCase) => {
	return async (
		req: FastifyRequest<{
			Params: { userId: string };
		}>,
		reply: FastifyReply,
	) => {
		const userId = new UserId(req.params.userId);
		const userStats = await usecase.execute(userId);
		return reply.send(userStats);
	};
};
