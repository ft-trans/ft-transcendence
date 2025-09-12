import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import websocket from "@fastify/websocket";
import { PrismaClient } from "@infra/database/generated";
import { Transaction } from "@infra/database/index";
import { InMemoryRepository } from "@infra/in_memory";
import { KVSRepository } from "@infra/kvs";
import { authController } from "@presentation/controllers/auth_controller";
import { pongController } from "@presentation/controllers/pong_controller";
import { profileController } from "@presentation/controllers/profile_controller";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/api/health", async (_req, _reply) => {
	return { message: "OK" };
});

const start = async () => {
	try {
		await app.register(FastifyVite, {
			root: resolve(import.meta.dirname, ".."),
			distDir: resolve(import.meta.dirname, ".."),
			dev: process.argv.includes("--dev"),
			spa: true,
		});

		const redis_url = process.env.REDIS_URL;
		if (!redis_url) {
			app.log.error(
				"REDIS_URL environment variable is missing. Please set it before starting the application.",
			);
			process.exit(1);
		}
		await app.register(FastifyRedis, {
			url: redis_url,
		});
		await app.register(websocket);

		const tx = new Transaction(new PrismaClient());
		const kvsRepo = new KVSRepository(app.redis);
		const inMemRepo = new InMemoryRepository();

		const registerUserUsecase = new RegisterUserUsecase(tx);
		await app.register(authController(registerUserUsecase), { prefix: "/api" });
		const updateUserUsecase = new UpdateUserUsecase(tx);
		const deleteUserUsecase = new DeleteUserUsecase(tx);
		await app.register(
			profileController(updateUserUsecase, deleteUserUsecase),
			{
				prefix: "/api",
			},
		);
		const joinPongUsecase = new JoinPongUsecase(inMemRepo, kvsRepo);
		const leavePongUsecase = new LeavePongUsecase(inMemRepo, kvsRepo);
		const startPongUsecase = new StartPongUsecase(kvsRepo);
		app.register(
			pongController(joinPongUsecase, leavePongUsecase, startPongUsecase),
			{ prefix: "/ws" },
		);

		app.get("/*", (_req, reply) => {
			return reply.html();
		});

		await app.vite.ready();
		await app.listen({ host: "0.0.0.0", port: 3000 });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
