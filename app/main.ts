import { resolve } from "node:path";
import { MatchmakingService } from "@domain/service/matchmaking_service";
import FastifyCookie from "@fastify/cookie";
import FastifyRedis from "@fastify/redis";
import FastifyVite from "@fastify/vite";
import websocket from "@fastify/websocket";
import { MatchmakingQueueRepository } from "@infra/database/matchmaking_queue_repository";
import { prisma } from "@infra/database/prisma";
import { Transaction } from "@infra/database/transaction";
import { InMemoryChatClientRepository } from "@infra/in_memory/chat_client_repository";
import { InMemoryMatchmakingClientRepository } from "@infra/in_memory/matchmaking_client_repository";
import { Repository } from "@infra/repository";
import { presenceController } from "@presentation/controllers/api/presence_controller";
import { authController } from "@presentation/controllers/auth_controller";
import { matchmakingController } from "@presentation/controllers/matchmaking_controller";
import { matchmakingWsController } from "@presentation/controllers/matchmaking_ws_controller";
import { pongController } from "@presentation/controllers/pong_controller";
import { profileController } from "@presentation/controllers/profile_controller";
import { relationshipController } from "@presentation/controllers/relationship_controller";
import { userController } from "@presentation/controllers/user_controller";
import { chatController as webSocketChatController } from "@presentation/controllers/ws/chat_controller";
import { createAuthPrehandler } from "@presentation/hooks/auth_prehandler";
import { MESSAGE_TYPES } from "@shared/api/chat";
import { LoginUserUsecase } from "@usecase/auth/login_user_usecase";
import { LogoutUserUsecase } from "@usecase/auth/logout_user_usecase";
import { RegisterUserUsecase } from "@usecase/auth/register_user_usecase";
import {
	GetDirectMessagesUsecase,
	JoinChatUsecase,
	LeaveChatUsecase,
	SendDirectMessageUsecase,
	SendGameInviteUsecase,
} from "@usecase/chat";
import { GetMatchPlayersUseCase } from "@usecase/game/get_match_players_usecase";
import { GetMatchUseCase } from "@usecase/game/get_match_usecase";
import { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import { LeaveMatchmakingUseCase } from "@usecase/game/leave_matchmaking_usecase";
import { AddPongClientUsecase } from "@usecase/pong/add_pong_client_usecase.js";
import { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import { StopPongUsecase } from "@usecase/pong/stop_pong_usecase";
import { UpdatePongPaddleUsecase } from "@usecase/pong/update_pong_paddle_usecase";
import {
	ExtendUserOnlineUsecase,
	GetOnlineUsersUsecase,
	GetUsersOnlineStatusUsecase,
	IsUserOnlineUsecase,
	SetUserOfflineUsecase,
	SetUserOnlineUsecase,
} from "@usecase/presence";
import { BlockUserUsecase } from "@usecase/relationship/block_user_usecase";
import { CancelFriendRequestUsecase } from "@usecase/relationship/cancel_friend_request_usecase";
import { GetFriendRequestsUsecase } from "@usecase/relationship/get_friend_requests_usecase";
import { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import { GetSentFriendRequestsUsecase } from "@usecase/relationship/get_sent_friend_requests_usecase";
import { RemoveFriendUsecase } from "@usecase/relationship/remove_friend_usecase";
import { RespondToFriendRequestUsecase } from "@usecase/relationship/respond_to_friend_request_usecase";
import { SendFriendRequestUsecase } from "@usecase/relationship/send_friend_request_usecase";
import { UnblockUserUsecase } from "@usecase/relationship/unblock_user_usecase";
import { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import { FindUserUsecase } from "@usecase/user/find_user_usecase";
import { SearchUsersUsecase } from "@usecase/user/search_users_usecase";
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

		await app.register(FastifyCookie);

		const redisUrl = process.env.REDIS_URL;
		if (!redisUrl) {
			app.log.error("REDIS_URL is not set");
			process.exit(1);
		}

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
		const queueRepo = new MatchmakingQueueRepository(app.redis, {
			prefix: "mm",
		});
		const matchmakingClientRepository =
			new InMemoryMatchmakingClientRepository();

		const matchmakingService = new MatchmakingService(
			tx,
			queueRepo,
			matchmakingClientRepository,
		);
		const joinMatchmakingUseCase = new JoinMatchmakingUseCase(
			repo.newUserRepository(),
			matchmakingService,
		);
		const leaveMatchmakingUseCase = new LeaveMatchmakingUseCase(
			matchmakingService,
		);

		// プレゼンス機能のユースケース
		const setUserOnlineUsecase = new SetUserOnlineUsecase(repo);
		const setUserOfflineUsecase = new SetUserOfflineUsecase(repo);
		const extendUserOnlineUsecase = new ExtendUserOnlineUsecase(repo);
		const getOnlineUsersUsecase = new GetOnlineUsersUsecase(repo);
		const getUsersOnlineStatusUsecase = new GetUsersOnlineStatusUsecase(repo);
		const isUserOnlineUsecase = new IsUserOnlineUsecase(repo);

		await app.register(
			profileController(updateUserUsecase, deleteUserUsecase),
			{ prefix: "/api" },
		);

		const chatClientRepository = new InMemoryChatClientRepository();
		const sendDirectMessageUsecase = new SendDirectMessageUsecase(tx);
		const sendGameInviteUsecase = new SendGameInviteUsecase(
			repo.newUserRepository(),
			chatClientRepository,
		);
		const joinChatUsecase = new JoinChatUsecase(chatClientRepository);
		const leaveChatUsecase = new LeaveChatUsecase(chatClientRepository);
		const getDirectMessagesUsecase = new GetDirectMessagesUsecase(tx);

		// WebSocketチャットコントローラーを登録
		app.register(
			webSocketChatController(
				joinChatUsecase,
				leaveChatUsecase,
				null, // メッセージ送信はAPIで処理
				sendGameInviteUsecase,
				authPrehandler,
			),
			{ prefix: "/ws" },
		);

		// GET ハンドラー - メッセージ履歴取得
		app.get<{ Params: { partnerId: string } }>(
			"/api/dms/:partnerId",
			{ preHandler: authPrehandler },
			async (req, reply) => {
				const userId = req.authenticatedUser?.id;
				const messages = await getDirectMessagesUsecase.execute({
					senderId: userId,
					receiverId: req.params.partnerId,
				});

				const responseBody = messages.map((message) => ({
					id: message.id,
					sender: {
						id: message.sender.id.value,
						username: message.sender.username.value,
					},
					receiver: {
						id: message.receiver.id.value,
						username: message.receiver.username.value,
					},
					content: message.content,
					isRead: message.isRead,
					sentAt: message.sentAt.toISOString(),
				}));

				return reply.send(responseBody);
			},
		);

		app.post<{ Body: { receiverId: string; content: string } }>(
			"/api/dms",
			{ preHandler: authPrehandler },
			async (req, reply) => {
				const input = req.body;
				const senderId = req.authenticatedUser?.id;

				// 1. データベースにメッセージを保存する
				const sentMessage = await sendDirectMessageUsecase.execute({
					senderId,
					receiverId: input.receiverId,
					content: input.content,
				});

				// 2. 相手がオンラインならWebSocketで通知する
				const receiverClient = chatClientRepository.findByUserId(
					sentMessage.receiver.id,
				);
				if (receiverClient) {
					receiverClient.send({
						type: MESSAGE_TYPES.NEW_MESSAGE,
						payload: {
							senderId: sentMessage.sender.id.value,
							senderName: sentMessage.sender.username.value,
							content: sentMessage.content,
							timestamp: sentMessage.sentAt.toISOString(),
						},
					});
				}

				const responseBody = {
					id: sentMessage.id,
					sender: {
						id: sentMessage.sender.id.value,
						username: sentMessage.sender.username.value,
					},
					receiver: {
						id: sentMessage.receiver.id.value,
						username: sentMessage.receiver.username.value,
					},
					content: sentMessage.content,
					isRead: sentMessage.isRead,
					sentAt: sentMessage.sentAt.toISOString(),
				};

				return reply.status(201).send(responseBody);
			},
		);

		// WebSocketプラグインをHTTPルート登録後に登録
		await app.register(websocket);

		// WebSocketプラグインを登録済みのため、ルート情報は省略

		const getFriendsUsecase = new GetFriendsUsecase(tx);
		const getFriendRequestsUsecase = new GetFriendRequestsUsecase(tx);
		const getSentFriendRequestsUsecase = new GetSentFriendRequestsUsecase(tx);
		const sendFriendRequestUsecase = new SendFriendRequestUsecase(tx);
		const respondToFriendRequestUsecase = new RespondToFriendRequestUsecase(tx);
		const removeFriendUsecase = new RemoveFriendUsecase(tx);
		const cancelFriendRequestUsecase = new CancelFriendRequestUsecase(tx);
		const blockUserUsecase = new BlockUserUsecase(tx);
		const unblockUserUsecase = new UnblockUserUsecase(tx);
		const searchUsersUsecase = new SearchUsersUsecase(tx);
		const findUserUsecase = new FindUserUsecase(repo);

		app.register(
			relationshipController(
				getFriendsUsecase,
				getFriendRequestsUsecase,
				getSentFriendRequestsUsecase,
				sendFriendRequestUsecase,
				respondToFriendRequestUsecase,
				removeFriendUsecase,
				cancelFriendRequestUsecase,
				blockUserUsecase,
				unblockUserUsecase,
				getUsersOnlineStatusUsecase,
				authPrehandler,
			),
			{ prefix: "/api" },
		);

		app.register(
			userController(
				searchUsersUsecase,
				findUserUsecase,
				getUsersOnlineStatusUsecase,
				authPrehandler,
			),
			{ prefix: "/api" },
		);

		await app.register(
			presenceController(
				setUserOnlineUsecase,
				setUserOfflineUsecase,
				extendUserOnlineUsecase,
				getOnlineUsersUsecase,
				getUsersOnlineStatusUsecase,
				isUserOnlineUsecase,
				authPrehandler,
			),
			{ prefix: "/api" },
		);

		const getMatchUseCase = new GetMatchUseCase(repo.newMatchRepository());
		const startPongUsecase = new StartPongUsecase(repo);
		const getMatchPlayersUseCase = new GetMatchPlayersUseCase(repo);
		await app.register(
			matchmakingController(
				getMatchUseCase,
				getMatchPlayersUseCase,
				joinMatchmakingUseCase,
				leaveMatchmakingUseCase,
				startPongUsecase,
				authPrehandler,
			),
			{
				prefix: "/api",
			},
		);

		await app.register(
			matchmakingWsController(
				authPrehandler,
				matchmakingClientRepository,
				setUserOnlineUsecase,
				setUserOfflineUsecase,
				extendUserOnlineUsecase,
			),
			{ prefix: "/ws" },
		);

		const addPongClientUsecase = new AddPongClientUsecase(repo);
		const joinPongUsecase = new JoinPongUsecase(repo);
		const leavePongUsecase = new LeavePongUsecase(repo);
		const updatePongPaddleUsecase = new UpdatePongPaddleUsecase(repo);
		const stopPongUsecase = new StopPongUsecase(repo);
		app.register(
			pongController(
				addPongClientUsecase,
				joinPongUsecase,
				leavePongUsecase,
				updatePongPaddleUsecase,
				startPongUsecase,
				stopPongUsecase,
				authPrehandler,
			),
			{ prefix: "/ws" },
		);

		app.get("/*", (_req, reply) => {
			return reply.html();
		});

		await app.vite.ready();
		await app.listen({ host: "0.0.0.0", port: 3000 });
		app.log.info("HTTP server listening on :3000");
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
