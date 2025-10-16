import { readFileSync } from "node:fs";

import { resolve } from "node:path";
import FastifyCookie from "@fastify/cookie";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import websocket from "@fastify/websocket";
import { prisma } from "@infra/database/prisma";
import { Transaction } from "@infra/database/transaction";
import { InMemoryChatClientRepository } from "@infra/in_memory/chat_client_repository";
import { Repository } from "@infra/repository";
import { authController } from "@presentation/controllers/auth_controller";
import { chatController } from "@presentation/controllers/chat_controller";
import { pongController } from "@presentation/controllers/pong_controller";
import { profileController } from "@presentation/controllers/profile_controller";
import { createAuthPrehandler } from "@presentation/hooks/auth_prehandler";
import { LoginUserUsecase } from "@usecase/auth/login_user_usecase";
import { LogoutUserUsecase } from "@usecase/auth/logout_user_usecase";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import {
	JoinChatUsecase,
	LeaveChatUsecase,
	SendChatMessageUsecase,
	SendDirectMessageUsecase,
	SendGameInviteUsecase,
} from "@usecase/chat";
import { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import Fastify from "fastify";
import type { TransportTargetOptions } from "pino";
import { otelInstrumentation } from "./observability/otel.js";

const isProd = process.env.NODE_ENV === "production";

const logToEs = process.env.LOG_TO_ES
	? process.env.LOG_TO_ES === "true"
	: isProd;
const logStdout = process.env.LOG_STDOUT
	? process.env.LOG_STDOUT === "true"
	: !isProd;

const targets: TransportTargetOptions[] = [];

if (logStdout) {
	targets.push({
		target: "pino/file",
		level: isProd ? "info" : "debug",
		options: { destination: 1 }, // stdout
	});
}

if (logToEs) {
	const elasticCaPath = process.env.ELASTIC_CA || "/app/certs/ca/ca.crt";
	const elasticPassword = process.env.ELASTIC_PASSWORD;
	if (!elasticPassword) {
		console.error("[boot] missing ELASTIC_PASSWORD");
		process.exit(1);
	}
	targets.push({
		target: "pino-elasticsearch",
		level: "info",
		options: {
			index: "app-logs",
			node: "https://es01:9200",
			esVersion: 9,
			auth: { username: "elastic", password: elasticPassword },
			tls: { ca: readFileSync(elasticCaPath), rejectUnauthorized: true },
		},
	});
}

const app = Fastify({
	logger: targets.length
		? {
				level: isProd ? "info" : "debug",
				timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
				transport: { targets },
			}
		: {
				level: isProd ? "info" : "debug",
				timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
			},
});

const start = async () => {
	app.log.info("Testing logger to ES");
	try {
		app.get("/api/health", async () => ({ message: "OK" }));

		await app.register(otelInstrumentation.plugin());

		await app.register(FastifyVite, {
			root: resolve(import.meta.dirname, ".."),
			distDir: resolve(import.meta.dirname, ".."),
			dev: process.argv.includes("--dev"),
			spa: true,
		});

		await app.register(FastifyCookie);

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
		const loginUserUsecase = new LoginUserUsecase(tx);
		const logoutUserUsecase = new LogoutUserUsecase(tx);
		const authPrehandler = createAuthPrehandler(
			repo.newSessionRepository(),
			repo.newUserRepository(),
		);
		await app.register(
			authController(
				registerUserUsecase,
				loginUserUsecase,
				logoutUserUsecase,
				authPrehandler,
			),
			{ prefix: "/api" },
		);
		const updateUserUsecase = new UpdateUserUsecase(tx);
		const deleteUserUsecase = new DeleteUserUsecase(tx);

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

		const chatClientRepository = new InMemoryChatClientRepository();
		const sendDirectMessageUsecase = new SendDirectMessageUsecase(tx);
		const sendChatMessageUsecase = new SendChatMessageUsecase(
			sendDirectMessageUsecase,
			chatClientRepository,
		);
		const sendGameInviteUsecase = new SendGameInviteUsecase(
			repo.newUserRepository(),
			chatClientRepository,
		);
		const joinChatUsecase = new JoinChatUsecase(chatClientRepository);
		const leaveChatUsecase = new LeaveChatUsecase(chatClientRepository);
		app.register(
			chatController(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
			),
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
