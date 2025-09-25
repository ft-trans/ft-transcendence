import { ErrBadRequest } from "@domain/error";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import {
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
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post("/auth/register", onRegisterUser(registerUserUsecase));
		fastify.post("/auth/login", onLoginUser(loginUserUsecase));
		fastify.delete(
			"/auth/logout",
			{ preHandler: authPrehandler },
			onLogoutUser(logoutUserUsecase),
		);
	};
};

const cookieName = "ft_trans";

const onRegisterUser = (usecase: RegisterUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: RegisterUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = registerUserFormSchema.safeParse({
			email: req.body.user.email,
			password: req.body.user.password,
			passwordConfirm: req.body.user.password,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new ErrBadRequest({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
					password: flattened.fieldErrors.password?.join(", "),
					passwordConfirm: flattened.fieldErrors.passwordConfirm?.join(", "),
				},
			});
		}
		const output = await usecase.execute({
			email: input.data.email,
			password: input.data.password,
		});
		reply.send({
			user: {
				id: output.id.value,
				email: output.email.value,
			},
		});
	};
};

const onLoginUser = (usecase: LoginUserUsecase) => {
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

		// TODO: Implement secure cookie handling
		// - Set httpOnly flag for security
		// - Set secure flag for HTTPS
		// - Set sameSite attribute for CSRF protection
		// - Consider cookie encryption/signing
		reply.setCookie(cookieName, output.sessionToken, {
			httpOnly: true,
			// secure: true, // Enable in production with HTTPS
			expires: output.session.expiresAt,
			path: "/",
		});

		reply.send({
			user: {
				id: output.session.userId.value,
				email: input.data.email,
			},
		});
	};
};

const onLogoutUser = (usecase: LogoutUserUsecase) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		const sessionToken = req.cookies[cookieName];
		if (!sessionToken) {
			throw new ErrBadRequest({
				userMessage: "セッションが見つかりません",
			});
		}

		await usecase.execute({
			sessionToken,
		});

		// TODO: Implement secure cookie clearing
		// - Clear with same domain/path settings as when set
		// - Consider security implications of cookie clearing
		reply.clearCookie(cookieName, {
			path: "/",
		});

		reply.send({
			user: req.authenticatedUser,
		});
	};
};
