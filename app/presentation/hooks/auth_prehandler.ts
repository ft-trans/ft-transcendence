import { ErrUnauthorized } from "@domain/error";
import { SessionToken } from "@domain/model";
import type { ISessionRepository } from "@domain/repository/session_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
	interface FastifyRequest {
		authenticatedUser?: {
			id: string;
			email: string;
		};
	}
}

const cookieName = "ft_trans";

export type AuthPrehandler = (
	request: FastifyRequest,
	reply: FastifyReply,
) => Promise<void>;

export const createAuthPrehandler = (
	sessionRepository: ISessionRepository,
	userRepository: IUserRepository,
): AuthPrehandler => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		// 認証処理開始

		const token = request.cookies[cookieName];
		if (!token) {
			reply.clearCookie(cookieName, { path: "/" });
			throw new ErrUnauthorized();
		}

		const sessionToken = new SessionToken(token);
		const session = await sessionRepository.findByToken(sessionToken);

		if (!session || !session.isValid(sessionToken)) {
			reply.clearCookie(cookieName, { path: "/" });
			throw new ErrUnauthorized();
		}

		const user = await userRepository.findById(session.userId);
		if (!user) {
			reply.clearCookie(cookieName, { path: "/" });
			throw new ErrUnauthorized();
		}

		request.authenticatedUser = {
			id: user.id.value,
			email: user.email.value,
		};
	};
};
