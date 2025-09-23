// src/interfaces/controllers/directMessageController.ts

import { ErrBadRequest } from "@domain/error";
import type { DirectMessage } from "@domain/model/direct_message";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

export const chatController = (
	getDirectMessagesUsecase: GetDirectMessagesUsecase,
	sendDirectMessageUsecase: SendDirectMessageUsecase,
) => {
	return async (fastify: FastifyInstance) => {
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
