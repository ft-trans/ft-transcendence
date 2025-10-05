import { InMemoryChatClient } from "@infra/in_memory/chat_client";
import type { ClientMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";

export const chatController = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	sendChatMessageUsecase: SendChatMessageUsecase | null,
	sendGameInviteUsecase: SendGameInviteUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/chat",
			{ websocket: true },
			onConnectClient(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
			),
		);
	};
};

const onConnectClient = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	_sendChatMessageUsecase: SendChatMessageUsecase | null,
	sendGameInviteUsecase: SendGameInviteUsecase,
) => {
	return async (connection: unknown, req: FastifyRequest) => {
		// Get userId from query parameter
		const userId = (req.query as { userId?: string })?.userId;
		console.log(`[WS Chat] Client connected: ${userId}`);

		if (userId) {
			// WebSocketアダプター: FastifyのconnectionをWebSocket風にラップ
			// biome-ignore lint/suspicious/noExplicitAny: Fastify WebSocket connectionは特定の型がないためanyを使用
			const connectionWithAny = connection as any;
			const webSocketAdapter = {
				send: (data: string) => connectionWithAny.send(data),
				close: () => connectionWithAny.close(),
				// InMemoryChatClientがWebSocketインターフェースを期待するためのダミープロパティ
				binaryType: "nodebuffer" as const,
				bufferedAmount: 0,
				extensions: "",
				protocol: "",
				readyState: 1, // WebSocket.OPEN
				url: "",
				onopen: null,
				onmessage: null,
				onerror: null,
				onclose: null,
				addEventListener: () => {},
				removeEventListener: () => {},
			};

			// biome-ignore lint/suspicious/noExplicitAny: WebSocketアダプターはWebSocketの一部のインターフェースのみ実装
			const chatClient = new InMemoryChatClient(
				webSocketAdapter as any,
				userId,
			);

			joinChatUsecase.execute(chatClient);

			connectionWithAny.on("message", async (data: Buffer) => {
				try {
					const message: ClientMessage = JSON.parse(data.toString());

					switch (message.type) {
						case MESSAGE_TYPES.SEND_MESSAGE:
							// メッセージ送信はAPIで処理されるため、WebSocketでは何もしない
							return;
						case MESSAGE_TYPES.SEND_GAME_INVITE:
							await sendGameInviteUsecase.execute({
								senderId: userId,
								...message.payload,
							});
							break;
						default:
							console.warn(
								"Unknown WebSocket message type:",
								JSON.stringify(message),
							);
					}
				} catch (error) {
					console.error("[WS Chat] Error processing WebSocket message:", error);
				}
			});

			connectionWithAny.on("close", () => {
				console.log(`[WS Chat] Client disconnected: ${userId}`);
				leaveChatUsecase.execute(chatClient);
			});

			connectionWithAny.on("error", (err: Error) => {
				console.error(`[WS Chat] Connection error for user ${userId}:`, err);
				leaveChatUsecase.execute(chatClient);
			});
		}
	};
};
