import { InMemoryChatClient } from "@infra/in_memory/chat_client";
import type { ClientMessage } from "@shared/api/chat";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type WebSocket from "ws";

export const webSocketChatController = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	sendChatMessageUsecase: SendChatMessageUsecase,
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
	sendChatMessageUsecase: SendChatMessageUsecase,
	sendGameInviteUsecase: SendGameInviteUsecase,
) => {
	return async (socket: WebSocket, req: FastifyRequest) => {
		// TODO: Should authenticate user and get userId
		const userId = req.headers["x-user-id"] as string; // Temporary solution for getting user id
		if (!userId) {
			socket.close(1008, "User not authenticated");
			return;
		}

		const chatClient = new InMemoryChatClient(socket);
		chatClient.setUserId(userId);

		joinChatUsecase.execute(chatClient);

		socket.onmessage = async (event: WebSocket.MessageEvent) => {
			try {
				const message: ClientMessage = JSON.parse(event.data.toString());

				switch (message.type) {
					case "sendMessage":
						await sendChatMessageUsecase.execute({
							senderId: userId,
							...message.payload,
						});
						break;
					case "sendGameInvite":
						await sendGameInviteUsecase.execute({
							senderId: userId,
							...message.payload,
						});
						break;
				}
			} catch (error) {
				// TODO: Error handling
				console.error(error);
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
