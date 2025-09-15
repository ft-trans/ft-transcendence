import { ErrBadRequest } from "@domain/error";
import {
	type RegisterUserRequest,
	registerUserFormSchema,
} from "@shared/api/auth";
import type { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const authController = (registerUserUsecase: RegisterUserUsecase) => {
	return async (fastify: FastifyInstance) => {
		fastify.post("/auth/register", onRegisterUser(registerUserUsecase));
	};
};

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
