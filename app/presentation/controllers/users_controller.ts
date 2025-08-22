import { ErrBadRequest } from "@domain/error";
import {
	type UpdateUserRequest,
	updateUserFormSchema,
} from "@shared/api/users";
import type { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const usersController = (updateUserUsecase: UpdateUserUsecase) => {
	return async (fastify: FastifyInstance) => {
		fastify.put("/users/me", onUpdateUser(updateUserUsecase));
	};
};

const onUpdateUser = (usecase: UpdateUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: UpdateUserRequest }>,
		reply: FastifyReply,
	) => {
		const input = updateUserFormSchema.safeParse({
			email: req.body.user.email,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new ErrBadRequest({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
				},
			});
		}
		// TODO: セッションからuserIdを取得する
		// **********************************************************
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID
		// **********************************************************

		const output = await usecase.execute({
			id: userId,
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
