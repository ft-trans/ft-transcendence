import type { RegisterUserRequest } from "@shared/api/auth";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import type { ITransaction } from "@usecase/transaction";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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
		const usecase = new RegisterUserUsecase(tx);
		const output = await usecase.execute({
			email: req.body.user.email,
		});
		reply.send({
			user: {
				id: output.id,
				email: output.email,
			},
		});
	};
};
