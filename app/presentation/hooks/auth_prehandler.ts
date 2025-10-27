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

// auth_controller.ts と重複
const cookieName = "ft_trans";
const getSecureCookieOptions = () => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	domain: process.env.COOKIE_DOMAIN,
	signed: true,
	path: "/",
});

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

		const token = request.unsignCookie(request.cookies[cookieName] || "").value;
		if (!token) {
			reply.clearCookie(cookieName, getSecureCookieOptions());
			throw new ErrUnauthorized();
		}

		const sessionToken = new SessionToken(token);
		const session = await sessionRepository.findByToken(sessionToken);

		if (!session || !session.isValid(sessionToken)) {
			reply.clearCookie(cookieName, getSecureCookieOptions());
			throw new ErrUnauthorized();
		}

		const user = await userRepository.findById(session.userId);
		if (!user) {
			reply.clearCookie(cookieName, getSecureCookieOptions());
			throw new ErrUnauthorized();
		}

		request.authenticatedUser = {
			id: user.id.value,
			email: user.email.value,
		};
	};
};
