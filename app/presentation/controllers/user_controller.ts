import type { User } from "@domain/model/user";
import { UserId } from "@domain/model/user";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { FindUserUsecase } from "@usecase/user/find_user_usecase";
import type { SearchUsersUsecase } from "@usecase/user/search_users_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const userController = (
	searchUsersUsecase: SearchUsersUsecase,
	findUserUsecase: FindUserUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/users",
			{ preHandler: authPrehandler },
			onSearchUsers(searchUsersUsecase),
		);
		fastify.get(
			"/users/:userId",
			{ preHandler: authPrehandler },
			onGetUser(findUserUsecase),
		);
	};
};

/**
 * Userドメインオブジェクトをクライアント向けのJSONオブジェクト（DTO）に変換するヘルパー関数
 */
const toUserDTO = (user: User) => {
	return {
		id: user.id.value,
		username: user.username.value,
		avatar: user.avatar.value,
		status: user.status.value,
	};
};

const onSearchUsers = (usecase: SearchUsersUsecase) => {
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

			const responseBody = users.map(toUserDTO);

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

const onGetUser = (usecase: FindUserUsecase) => {
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
			const responseBody = toUserDTO(user);

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
