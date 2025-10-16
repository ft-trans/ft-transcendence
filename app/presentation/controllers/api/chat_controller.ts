// src/interfaces/controllers/directMessageController.ts

import { ErrBadRequest } from "@domain/error";
import type { DirectMessage } from "@domain/model/direct_message";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import { MESSAGE_TYPES } from "@shared/api/chat";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

/**
 * Zod validation error handling helper function
 */
const handleValidationError = (parseError: z.ZodError) => {
	const flat = parseError.flatten();
	const details: Record<string, string> = {};
	for (const [key, value] of Object.entries(flat.fieldErrors)) {
		if (Array.isArray(value) && value.length > 0) {
			details[key] = value.join(", ");
		}
	}
	if (flat.formErrors && flat.formErrors.length > 0) {
		details.formErrors = flat.formErrors.join(", ");
	}
	throw new ErrBadRequest({ details });
};

export const chatController = (
	getDirectMessagesUsecase: GetDirectMessagesUsecase,
	sendDirectMessageUsecase: SendDirectMessageUsecase,
	authPrehandler: AuthPrehandler,
	chatClientRepository: IChatClientRepository,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/dms/:partnerId",
			{ preHandler: authPrehandler },
			onGetDirectMessages(getDirectMessagesUsecase),
		);

		fastify.post(
			"/dms",
			{ preHandler: authPrehandler },
			onSendDirectMessage(sendDirectMessageUsecase, chatClientRepository),
		);
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
			username: message.sender.username.value,
		},
		receiver: {
			id: message.receiver.id.value,
			username: message.receiver.username.value,
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
		const userId = req.authenticatedUser?.id;

		const messages = await usecase.execute({
			senderId: userId,
			receiverId: req.params.partnerId,
		});

		const responseBody = messages.map(toDirectMessageDTO);

		return reply.send(responseBody);
	};
};

const sendDirectMessageSchema = z.object({
	receiverId: z.string(),
	content: z.string().min(1),
});

const onSendDirectMessage = (
	usecase: SendDirectMessageUsecase,
	chatClientRepository: IChatClientRepository,
) => {
	return async (
		req: FastifyRequest<{ Body: z.infer<typeof sendDirectMessageSchema> }>,
		reply: FastifyReply,
	) => {
		const input = sendDirectMessageSchema.safeParse(req.body);
		if (!input.success) {
			handleValidationError(input.error);
		}
		const senderId = req.authenticatedUser?.id;

		// 1. データベースにメッセージを保存する
		const sentMessage = await usecase.execute({
			senderId,
			receiverId: input.data.receiverId,
			content: input.data.content,
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

		const responseBody = toDirectMessageDTO(sentMessage);

		// 3. APIレスポンスを返す
		if (reply.sent) {
			return;
		}
		return reply.status(201).send(responseBody);
	};
};
