import { ErrUnauthorized } from "@domain/error";
import { SessionToken } from "@domain/model";
import type { ISessionRepository } from "@domain/repository/session_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import type {
	FastifyReply,
	FastifyRequest,
	HookHandlerDoneFunction,
} from "fastify";

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
	done: HookHandlerDoneFunction,
) => Promise<void>;

export const createAuthPrehandler = (
	sessionRepository: ISessionRepository,
	userRepository: IUserRepository,
): AuthPrehandler => {
	return async (
		request: FastifyRequest,
		reply: FastifyReply,
		done: HookHandlerDoneFunction,
	) => {
		try {
			const token = request.cookies[cookieName];
			if (!token) {
				throw new ErrUnauthorized();
			}

			const sessionToken = new SessionToken(token);
			const session = await sessionRepository.findByToken(sessionToken);

			if (!session || !session.isValid(sessionToken)) {
				throw new ErrUnauthorized();
			}

			const user = await userRepository.findById(session.userId);
			if (!user) {
				throw new ErrUnauthorized();
			}

			request.authenticatedUser = {
				id: user.id.value,
				email: user.email.value,
			};

			done();
		} catch (error) {
			if (error instanceof ErrUnauthorized) {
				reply.clearCookie(cookieName, { path: "/" });
				done(error);
			} else {
				done(error as Error);
			}
		}
	};
};
