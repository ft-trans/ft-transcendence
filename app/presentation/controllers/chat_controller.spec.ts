import { DirectMessage } from "@domain/model/direct_message";
import { User, UserEmail, UserId } from "@domain/model/user";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import Fastify from "fastify";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { chatController } from "./chat_controller";

const getDirectMessagesUsecase = mock<GetDirectMessagesUsecase>();

const fastify = Fastify();
fastify.register(chatController(getDirectMessagesUsecase));

describe("chatController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /chat/:userId/messages", () => {
		it("should return a list of direct messages", async () => {
			const sender = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("sender@example.com"),
			);
			const receiver = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("receiver@example.com"),
			);
			const messages = [
				new DirectMessage(ulid(), sender, receiver, "Hello", false, new Date()),
				new DirectMessage(ulid(), receiver, sender, "Hi", false, new Date()),
			];
			getDirectMessagesUsecase.execute.mockResolvedValue(messages);

			const response = await fastify.inject({
				method: "GET",
				url: `/chat/${receiver.id.value}/messages`,
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({
				messages: messages.map((message) => ({
					id: message.id,
					content: message.content,
					senderId: message.sender.id.value,
					receiverId: message.receiver.id.value,
					sentAt: message.sentAt.toISOString(),
				})),
			});
		});
	});
});
