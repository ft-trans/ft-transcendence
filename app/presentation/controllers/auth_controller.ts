import { BadRequestError } from "@domain/error";
import {
	type RegisterUserRequest,
	registerUserFormSchema,
} from "@shared/api/auth";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import type { ITransaction } from "@usecase/transaction";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const authController = (tx: ITransaction) => {
	return async (fastify: FastifyInstance) => {
		fastify.post("/auth/register", onRegisterUser(tx));
	};
};

const onRegisterUser = (tx: ITransaction) => {
	return async (
		req: FastifyRequest<{ Body: RegisterUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = registerUserFormSchema.safeParse({
			email: req.body.user.email,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new BadRequestError({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
				},
			});
		}

		const usecase = new RegisterUserUsecase(tx);
		const output = await usecase.execute({
			email: input.data.email,
		});
		reply.send({
			user: {
				id: output.id,
				email: output.email,
			},
		});
	};
};
