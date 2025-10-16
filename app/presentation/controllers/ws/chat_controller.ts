import { InMemoryChatClient } from "@infra/in_memory/chat_client";
import type { IMatchmakingClientRepository } from "@infra/in_memory/matchmaking_client_repository";
import type { ClientMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Simplified WebSocket interface for chat functionality
 * Only includes the methods actually needed by InMemoryChatClient
 */
interface SimplifiedWebSocket {
	send(data: string): void;
	close(): void;
}

export const chatController = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	sendChatMessageUsecase: SendChatMessageUsecase | null,
	sendGameInviteUsecase: SendGameInviteUsecase,
	matchmakingClientRepository: IMatchmakingClientRepository,
	// biome-ignore lint/suspicious/noExplicitAny: Type import would cause circular dependency
	authPrehandler: any,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/chat",
			{
				websocket: true,
				preHandler: authPrehandler,
			},
			onConnectClient(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
				matchmakingClientRepository,
			),
		);
	};
};

const onConnectClient = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	_sendChatMessageUsecase: SendChatMessageUsecase | null,
	sendGameInviteUsecase: SendGameInviteUsecase,
	matchmakingClientRepository: IMatchmakingClientRepository,
) => {
	return async (connection: unknown, req: FastifyRequest) => {
		// Use authenticated user from prehandler instead of query parameter
		const userId = req.authenticatedUser?.id;

		if (userId) {
			// WebSocketアダプター: FastifyのconnectionをSimplifiedWebSocketインターフェースに適合させる
			// biome-ignore lint/suspicious/noExplicitAny: Fastify WebSocket connection型の互換性のため必要
			const connectionWithAny = connection as any;
			const webSocketAdapter: SimplifiedWebSocket = {
				send: (data: string) => connectionWithAny.send(data),
				close: () => connectionWithAny.close(),
			};

			const chatClient = new InMemoryChatClient(
				// biome-ignore lint/suspicious/noExplicitAny: WebSocketインターフェース互換性のため必要
				webSocketAdapter as any,
				userId,
			);

			joinChatUsecase.execute(chatClient);

			// マッチメイキングクライアントリポジトリにも登録（ゲーム招待用）
			// biome-ignore lint/suspicious/noExplicitAny: Fastify WebSocket connection型の互換性のため必要
			matchmakingClientRepository.add(userId, connection as any, req);

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
				leaveChatUsecase.execute(chatClient);
				matchmakingClientRepository.remove(userId);
			});

			connectionWithAny.on("error", (err: Error) => {
				console.error(`[WS Chat] Connection error for user ${userId}:`, err);
				leaveChatUsecase.execute(chatClient);
				matchmakingClientRepository.remove(userId);
			});
		}
	};
};
