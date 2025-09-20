import { resolve } from "node:path";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import websocket from "@fastify/websocket";
import { Transaction, UserRepository } from "@infra/database";
import { prisma } from "@infra/database/prisma";
import {
	InMemoryChatClientRepository,
	InMemoryRepository,
} from "@infra/in_memory";
import { KVSRepository } from "@infra/kvs";
import { apiChatController } from "@presentation/controllers/api_chat_controller";
import { authController } from "@presentation/controllers/auth_controller";
import { pongController } from "@presentation/controllers/pong_controller";
import { profileController } from "@presentation/controllers/profile_controller";
import { relationshipController } from "@presentation/controllers/relationship_controller";
import { webSocketChatController } from "@presentation/controllers/ws_chat_controller";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import {
	GetDirectMessagesUsecase,
	JoinChatUsecase,
	LeaveChatUsecase,
	SendChatMessageUsecase,
	SendDirectMessageUsecase,
	SendGameInviteUsecase,
} from "@usecase/chat";
import { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import { BlockUserUsecase } from "@usecase/relationship/block_user_usecase";
import { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import { RemoveFriendUsecase } from "@usecase/relationship/remove_friend_usecase";
import { RespondToFriendRequestUsecase } from "@usecase/relationship/respond_to_friend_request_usecase";
import { SendFriendRequestUsecase } from "@usecase/relationship/send_friend_request_usecase";
import { UnblockUserUsecase } from "@usecase/relationship/unblock_user_usecase";
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
		const kvsRepo = new KVSRepository(app.redis);
		const inMemRepo = new InMemoryRepository();
		const tx = new Transaction(prisma);
		const registerUserUsecase = new RegisterUserUsecase(tx);
		const updateUserUsecase = new UpdateUserUsecase(tx);
		const deleteUserUsecase = new DeleteUserUsecase(tx);

		await app.register(authController(registerUserUsecase), { prefix: "/api" });
		await app.register(
			profileController(updateUserUsecase, deleteUserUsecase),
			{ prefix: "/api" },
		);
		const joinPongUsecase = new JoinPongUsecase(inMemRepo, kvsRepo);
		const leavePongUsecase = new LeavePongUsecase(inMemRepo, kvsRepo);
		const startPongUsecase = new StartPongUsecase(kvsRepo);
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
		const userRepository = new UserRepository(prisma);
		const sendGameInviteUsecase = new SendGameInviteUsecase(
			userRepository,
			chatClientRepository,
		);
		const joinChatUsecase = new JoinChatUsecase(chatClientRepository);
		const leaveChatUsecase = new LeaveChatUsecase(chatClientRepository);
		const getDirectMessagesUsecase = new GetDirectMessagesUsecase(tx);
		app.register(
			webSocketChatController(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
			),
			{ prefix: "/ws" },
		);
		app.register(
			apiChatController(getDirectMessagesUsecase, sendDirectMessageUsecase),
			{ prefix: "/api" },
		);

		const getFriendsUsecase = new GetFriendsUsecase(tx);
		const sendFriendRequestUsecase = new SendFriendRequestUsecase(tx);
		const respondToFriendRequestUsecase = new RespondToFriendRequestUsecase(tx);
		const removeFriendUsecase = new RemoveFriendUsecase(tx);
		const blockUserUsecase = new BlockUserUsecase(tx);
		const unblockUserUsecase = new UnblockUserUsecase(tx);
		app.register(
			relationshipController(
				getFriendsUsecase,
				sendFriendRequestUsecase,
				respondToFriendRequestUsecase,
				removeFriendUsecase,
				blockUserUsecase,
				unblockUserUsecase,
			),
			{ prefix: "/api" },
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
