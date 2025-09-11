import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import { Transaction } from "@infra/database";
import { PrismaClient } from "@infra/database/generated";

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
import { MatchHistoryRepository } from "@infra/database/match_history_repository";
import { MatchmakingQueueRepository } from "@infra/database/matchmaking_queue_repository";


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

		const tx = new Transaction(new PrismaClient());

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

		const joinUserUsecase = new JoinMatchmakingUseCase();
		const leaveUserUsecase = new LeaveMatchmakingUseCase();
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
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();