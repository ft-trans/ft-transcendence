import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	InMemoryUserRepository,
	MockTransactionManager,
} from "../../infra/database";
import {
	DeleteUserUsecase,
	FindUserUsecase,
	RegisterUserUsecase,
	UpdateUserUsecase,
} from "../../usecase/index.js";

export const usersController = async (fastify: FastifyInstance) => {
	fastify.get("/users/:id", onGetUser);
	fastify.post("/users", onPostUser);
	fastify.put("/users/:id", onPutUser);
	fastify.delete("/users/:id", onDeleteUser);
};

type GetUserParams = {
	id: string;
};

const userRepo = new InMemoryUserRepository();

const onGetUser = async (
	req: FastifyRequest<{ Params: GetUserParams }>,
	reply: FastifyReply,
) => {
	const usecase = new FindUserUsecase(userRepo);

	const { id } = req.params;

	const output = await usecase.execute({
		id,
	});

	reply.send({
		user: {
			id: output.id,
			name: output.name,
		},
	});
};

type PostUserBody = {
	user: {
		name: string;
	};
};

const onPostUser = async (
	req: FastifyRequest<{ Body: PostUserBody }>,
	reply: FastifyReply,
) => {
	const transactionManager = new MockTransactionManager();
	const usecase = new RegisterUserUsecase(transactionManager, userRepo);

	const { user } = req.body;

	const output = await usecase.execute({
		name: user.name,
	});

	reply.send({
		user: {
			id: output.id,
			name: output.name,
		},
	});
};

type PutUserParams = {
	id: string;
};

type PutUserBody = {
	user: {
		name: string;
	};
};

const onPutUser = async (
	req: FastifyRequest<{ Params: PutUserParams; Body: PutUserBody }>,
	reply: FastifyReply,
) => {
	const transactionManager = new MockTransactionManager();
	const usecase = new UpdateUserUsecase(transactionManager, userRepo);

	const { id } = req.params;
	const { user } = req.body;

	const output = await usecase.execute({
		id,
		name: user.name,
	});

	reply.send({
		user: {
			id: output.id,
			name: output.name,
		},
	});
};

type DeleteUserParams = {
	id: string;
};

const onDeleteUser = async (
	req: FastifyRequest<{ Params: DeleteUserParams }>,
	reply: FastifyReply,
) => {
	const transactionManager = new MockTransactionManager();
	const usecase = new DeleteUserUsecase(transactionManager, userRepo);

	const { id } = req.params;

	await usecase.execute({
		id,
	});

	reply.send({ message: "User deleted successfully" });
};
