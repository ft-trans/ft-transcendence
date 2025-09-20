import { ErrBadRequest } from "@domain/error";
import type { DirectMessage } from "@domain/model/direct_message";
import { InMemoryChatClient } from "@infra/in_memory/chat_client";
import type { ClientMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type WebSocket from "ws";
import { z } from "zod";

export const chatController = (
	joinChatUsecase: JoinChatUsecase,
	leaveChatUsecase: LeaveChatUsecase,
	sendChatMessageUsecase: SendChatMessageUsecase,
	sendGameInviteUsecase: SendGameInviteUsecase,
	getDirectMessagesUsecase: GetDirectMessagesUsecase,
	sendDirectMessageUsecase: SendDirectMessageUsecase,
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

		fastify.get(
			"/dms/:partnerId",
			onGetDirectMessages(getDirectMessagesUsecase),
		);
		fastify.post("/dms", onSendDirectMessage(sendDirectMessageUsecase));
	};
};

/**
 * DirectMessageドメインオブジェクトをクライアント向けのJSONオブジェクトに変換するヘルパー関数
 */
const toDirectMessageDTO = (message: DirectMessage) => {
	return {
		id: message.id,
		sender: {
			id: message.sender.id.value,
			email: message.sender.email.value,
		},
		receiver: {
			id: message.receiver.id.value,
			email: message.receiver.email.value,
		},
		content: message.content,
		isRead: message.isRead,
		sentAt: message.sentAt.toISOString(),
	};
};

const onGetDirectMessages = (usecase: GetDirectMessagesUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { partnerId: string } }>,
		reply: FastifyReply,
	) => {
		// TODO: セッションからuserIdを取得する
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

		const messages = await usecase.execute({
			senderId: userId,
			receiverId: req.params.partnerId,
		});

		const responseBody = messages.map(toDirectMessageDTO);

		reply.send(responseBody);
	};
};

const sendDirectMessageSchema = z.object({
	receiverId: z.string(),
	content: z.string().min(1),
});

const onSendDirectMessage = (usecase: SendDirectMessageUsecase) => {
	return async (
		req: FastifyRequest<{ Body: z.infer<typeof sendDirectMessageSchema> }>,
		reply: FastifyReply,
	) => {
		const input = sendDirectMessageSchema.safeParse(req.body);
		if (!input.success) {
			const flatDetails: Record<string, string> = {};
			const { fieldErrors, formErrors } = input.error.flatten();
			for (const key in fieldErrors) {
				if (fieldErrors[key]) {
					flatDetails[key] = fieldErrors[key].join(", ");
				}
			}
			if (formErrors && formErrors.length > 0) {
				flatDetails.formErrors = formErrors.join(", ");
			}
			throw new ErrBadRequest({ details: flatDetails });
		}
		// TODO: セッションからuserIdを取得する
		const senderId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID

		const sentMessage = await usecase.execute({
			senderId,
			receiverId: input.data.receiverId,
			content: input.data.content,
		});

		const responseBody = toDirectMessageDTO(sentMessage);

		reply.status(201).send(responseBody);
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

		const chatClient = new InMemoryChatClient(socket, userId);

		joinChatUsecase.execute(chatClient);

		socket.onmessage = async (event: WebSocket.MessageEvent) => {
			try {
				const message: ClientMessage = JSON.parse(event.data.toString());

				switch (message.type) {
					case MESSAGE_TYPES.SEND_MESSAGE:
						await sendChatMessageUsecase.execute({
							senderId: userId,
							...message.payload,
						});
						break;
					case MESSAGE_TYPES.SEND_GAME_INVITE:
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
