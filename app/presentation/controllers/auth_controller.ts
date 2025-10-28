import { ErrBadRequest } from "@domain/error";
import type { SessionBasedPresenceService } from "@domain/service/session_based_presence_service";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import {
	type AuthStatusResponse,
	type LoginUserRequest,
	loginUserFormSchema,
	type RegisterUserRequest,
	registerUserFormSchema,
} from "@shared/api/auth";
import type { LoginUserUsecase } from "@usecase/auth/login_user_usecase";
import type { LogoutUserUsecase } from "@usecase/auth/logout_user_usecase";
import type { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const authController = (
	registerUserUsecase: RegisterUserUsecase,
	loginUserUsecase: LoginUserUsecase,
	logoutUserUsecase: LogoutUserUsecase,
	authPrehandler: AuthPrehandler,
	presenceService?: SessionBasedPresenceService,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post("/auth/register", onRegisterUser(registerUserUsecase));
		fastify.post("/auth/login", onLoginUser(loginUserUsecase, presenceService));
		fastify.delete(
			"/auth/logout",
			{ preHandler: authPrehandler },
			onLogoutUser(logoutUserUsecase, presenceService),
		);
		fastify.get("/auth/status", { preHandler: authPrehandler }, onAuthStatus());
	};
};

// auth_prehandler.ts と重複
const cookieName = "ft_trans";
const getSecureCookieOptions = () => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	domain: process.env.COOKIE_DOMAIN,
	signed: true,
	path: "/",
});

const onRegisterUser = (usecase: RegisterUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: RegisterUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = registerUserFormSchema.safeParse({
			email: req.body.user.email,
			username: req.body.user.username,
			password: req.body.user.password,
			passwordConfirm: req.body.user.password,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new ErrBadRequest({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
					username: flattened.fieldErrors.username?.join(", "),
					password: flattened.fieldErrors.password?.join(", "),
					passwordConfirm: flattened.fieldErrors.passwordConfirm?.join(", "),
				},
			});
		}
		const output = await usecase.execute({
			email: input.data.email,
			username: input.data.username,
			password: input.data.password,
		});
		reply.send({
			user: {
				id: output.id.value,
				email: output.email.value,
				username: output.username.value,
				avatar: output.avatar.value,
				status: output.status.value,
			},
		});
	};
};

const onLoginUser = (
	usecase: LoginUserUsecase,
	presenceService?: SessionBasedPresenceService,
) => {
	return async (
		req: FastifyRequest<{ Body: LoginUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = loginUserFormSchema.safeParse({
			email: req.body.user.email,
			password: req.body.user.password,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new ErrBadRequest({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
					password: flattened.fieldErrors.password?.join(", "),
				},
			});
		}
		const output = await usecase.execute({
			email: input.data.email,
			password: input.data.password,
		});

		// set secure cookie
		reply.setCookie(cookieName, output.sessionToken, {
			...getSecureCookieOptions(),
			expires: output.session.expiresAt,
		});

		// セッション開始時のプレゼンス管理
		if (presenceService) {
			try {
				await presenceService.onSessionStart(
					output.session.userId.value,
					output.sessionToken,
				);
			} catch (error) {
				console.error(
					"[AuthController] Failed to start session presence:",
					error,
				);
			}
		}

		reply.send({
			user: {
				id: output.session.userId.value,
				email: input.data.email,
			},
		});
	};
};

const onLogoutUser = (
	usecase: LogoutUserUsecase,
	presenceService?: SessionBasedPresenceService,
) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		const sessionToken = req.unsignCookie(req.cookies[cookieName] || "").value;
		if (!sessionToken) {
			throw new ErrBadRequest({
				userMessage: "セッションが見つかりません",
			});
		}

		// セッション終了時のプレゼンス管理
		if (presenceService) {
			try {
				await presenceService.onSessionEnd(sessionToken);
			} catch (error) {
				console.error(
					"[AuthController] Failed to end session presence:",
					error,
				);
			}
		}

		await usecase.execute({
			sessionToken,
		});

		// secure cookie clearing
		reply.clearCookie(cookieName, getSecureCookieOptions());

		reply.send();
	};
};

const onAuthStatus = () => {
	return async (
		req: FastifyRequest,
		reply: FastifyReply<{
			Reply: AuthStatusResponse;
		}>,
	) => {
		if (req.authenticatedUser) {
			reply.send({
				user: {
					id: req.authenticatedUser.id,
					email: req.authenticatedUser.email,
				},
			});
		} else {
			reply.send({});
		}
	};
};
