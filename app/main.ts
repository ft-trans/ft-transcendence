import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import { Transaction } from "@infra/database";
import { prisma } from "@infra/database/prisma";
import { authController } from "@presentation/controllers/auth_controller";
import { profileController } from "@presentation/controllers/profile_controller";
import { matchmakingController } from "@presentation/controllers/matchmaking_controller";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import { LeaveMatchmakingUseCase } from "@usecase/game/leave_matchmaking_usecase";
import Fastify from "fastify";
import { MatchmakingService } from "@domain/service/matchmaking_service";		
import { UserRepository } from "@infra/database/user_repository";
import { MatchRepository } from "@infra/database/match_repository";
import { MatchmakingQueueRepository } from "@infra/database/matchmaking_queue_repository";
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
		await app.register(FastifyRedis, { url: redisUrl });

		const tx = new Transaction(prisma);
		const registerUserUsecase = new RegisterUserUsecase(tx);
		const updateUserUsecase = new UpdateUserUsecase(tx);
		const deleteUserUsecase = new DeleteUserUsecase(tx);
		const userRepo = new UserRepository(prisma);
		const matchRepo = new MatchRepository(prisma);
		const queueRepo = new MatchmakingQueueRepository(app.redis, {
		  prefix: "mm",
		});
		const matchmakingService = new MatchmakingService(
			tx, matchRepo, queueRepo
		);

		await app.register(authController(registerUserUsecase), { prefix: "/api" });
		await app.register(
			profileController(updateUserUsecase, deleteUserUsecase),
			{ prefix: "/api" },
		);

		const joinUserUsecase = new JoinMatchmakingUseCase(userRepo, matchmakingService);
		const leaveUserUsecase = new LeaveMatchmakingUseCase(matchmakingService);
		await app.register(
			matchmakingController(joinUserUsecase, leaveUserUsecase),
			{
				prefix: "/api"
			},
		);

		app.get("/*", (_req, reply) => {
			return reply.html();
		});

		await app.vite.ready();
		await app.listen({ host: "0.0.0.0", port: 3000 });
		app.log.info("HTTP app listening on :3000");
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();