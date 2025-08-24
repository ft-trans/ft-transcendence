import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const chatController = (
	getDirectMessagesUsecase: GetDirectMessagesUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/chat/:userId/messages",
			onGetDirectMessages(getDirectMessagesUsecase),
		);
	};
};

import type { DirectMessage } from "@domain/model/direct_message";

// ... (imports)

// ... (other code)

const onGetDirectMessages = (usecase: GetDirectMessagesUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { userId: string } }>,
		reply: FastifyReply,
	) => {
		// TODO: Get userId from session
		const senderId = "01K3DBE1RHZP8WFCZ3ZKB1NY4F"; // Mock user ID
		const messages = await usecase.execute({
			userId: senderId,
			correspondentId: req.params.userId,
		});
		reply.send({ messages: messages.map(serializeDirectMessage) });
	};
};

const serializeDirectMessage = (message: DirectMessage) => ({
	id: message.id,
	content: message.content,
	senderId: message.sender.id.value,
	receiverId: message.receiver.id.value,
	sentAt: message.sentAt.toISOString(),
});
