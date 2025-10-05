import { InMemoryChatClient } from "@infra/in_memory/chat_client";
import type { ClientMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type WebSocket from "ws";

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
	return async (socket: WebSocket, req: FastifyRequest) => {
		// Get userId from query parameter
		const userId = (req.query as { userId?: string })?.userId;
		if (!userId) {
			socket.terminate();
			return;
		}

		const chatClient = new InMemoryChatClient(socket, userId);

		joinChatUsecase.execute(chatClient);

		socket.onmessage = async (event: WebSocket.MessageEvent) => {
			try {
				const message: ClientMessage = JSON.parse(event.data.toString());

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
				console.error("Error processing WebSocket message:", error);
			}
		};

		socket.onclose = () => {
			leaveChatUsecase.execute(chatClient);
		};

		socket.onerror = (_err) => {
			leaveChatUsecase.execute(chatClient);
		};
	};
};
