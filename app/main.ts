import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import websocket from "@fastify/websocket";
import { prisma } from "@infra/database/prisma";
import { Transaction } from "@infra/database/transaction";
import { Repository } from "@infra/repository";
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
import { otelInstrumentation } from "./observability/otel.js";

const app = Fastify({ logger: true });

const start = async () => {
	try {
		app.get("/api/health", async () => ({ message: "OK" }));

		await app.register(otelInstrumentation.plugin());

		await app.register(FastifyVite, {
			root: resolve(import.meta.dirname, ".."),
			distDir: resolve(import.meta.dirname, ".."),
			dev: process.argv.includes("--dev"),
			spa: true,
		});

		const redisUrl = process.env.REDIS_URL;
		if (!redisUrl) {
			app.log.error("REDIS_URL is not set");
			process.exit(1);
		}

		await app.register(websocket);
		await app.register(FastifyRedis, { url: redisUrl });
		const repo = new Repository(prisma, app.redis);
		const tx = new Transaction(prisma, app.redis);
		const registerUserUsecase = new RegisterUserUsecase(tx);
		const updateUserUsecase = new UpdateUserUsecase(tx);
		const deleteUserUsecase = new DeleteUserUsecase(tx);

		await app.register(authController(registerUserUsecase), { prefix: "/api" });
		await app.register(
			profileController(updateUserUsecase, deleteUserUsecase),
			{ prefix: "/api" },
		);
		const joinPongUsecase = new JoinPongUsecase(repo);
		const leavePongUsecase = new LeavePongUsecase(repo);
		const startPongUsecase = new StartPongUsecase(repo);
		app.register(
			pongController(joinPongUsecase, leavePongUsecase, startPongUsecase),
			{ prefix: "/ws" },
		);

		app.get("/*", (_req, reply) => reply.html());

		await app.vite.ready();
		await app.listen({ host: "0.0.0.0", port: 3000 });
		app.log.info("HTTP app listening on :3000");
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
