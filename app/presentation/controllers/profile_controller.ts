import { ErrBadRequest } from "@domain/error";
import {
	type UpdateProfileRequest,
	updateProfileFormSchema,
} from "@shared/api/profile";
import type { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import type { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const profileController = (
	updateUserUsecase: UpdateUserUsecase,
	deleteUserUsecase: DeleteUserUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.put("/profile", onUpdateProfile(updateUserUsecase));
		fastify.delete("/profile", onDeleteProfile(deleteUserUsecase));
	};
};

const onUpdateProfile = (usecase: UpdateUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: UpdateProfileRequest }>,
		reply: FastifyReply,
	) => {
		const input = updateProfileFormSchema.safeParse({
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

const onDeleteProfile = (usecase: DeleteUserUsecase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		// TODO: セッションからuserIdを取得する
		// **********************************************************
		const userId = "01K24DQMEY074R1XNH3BKR3J17"; // 仮のユーザーID
		// **********************************************************

		const output = await usecase.execute({ id: userId });
		reply.send({
			user: {
				id: output.id,
				email: output.email,
			},
		});
	};
};
