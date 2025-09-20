import { ErrBadRequest } from "@domain/error";
import { DirectMessage } from "@domain/model/direct_message";
import { User, UserEmail, UserId } from "@domain/model/user";
import { chatController } from "@presentation/controllers/chat_controller";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

const sender = User.reconstruct(
	new UserId("01K24DQHXAJ2NFYKPZ812F4HBJ"),
	new UserEmail("sender@example.com"),
);
const receiver = User.reconstruct(
	new UserId("01K24DQHXAJ2NFYKPZ812F4HBP"),
	new UserEmail("receiver@example.com"),
);

describe("chatController HTTP endpoints", () => {
	let app: FastifyInstance;
	const joinChatUsecase = mock<JoinChatUsecase>();
	const leaveChatUsecase = mock<LeaveChatUsecase>();
	const sendChatMessageUsecase = mock<SendChatMessageUsecase>();
	const sendGameInviteUsecase = mock<SendGameInviteUsecase>();
	const getDirectMessagesUsecase = mock<GetDirectMessagesUsecase>();
	const sendDirectMessageUsecase = mock<SendDirectMessageUsecase>();

	beforeEach(() => {
		app = Fastify();
		app.setErrorHandler((error, _request, reply) => {
			if (error instanceof ErrBadRequest) {
				const err = error as ErrBadRequest;
				reply.status(400).send({
					error: {
						message: err.message,
						details: err.details,
					},
				});
			} else {
				reply.status(500).send({
					error: {
						message: "An unexpected error occurred",
					},
				});
			}
		});
		app.register(
			chatController(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
				getDirectMessagesUsecase,
				sendDirectMessageUsecase,
			),
		);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /dms/:partnerId", () => {
		it("should return direct messages with a partner", async () => {
			const messages = [
				new DirectMessage("msg1", sender, receiver, "Hello", false, new Date()),
			];
			getDirectMessagesUsecase.execute.mockResolvedValue(messages);

			const response = await app.inject({
				method: "GET",
				url: `/dms/${receiver.id.value}`,
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual(
				messages.map((m) => ({
					id: m.id,
					sender: { id: m.sender.id.value, email: m.sender.email.value },
					receiver: { id: m.receiver.id.value, email: m.receiver.email.value },
					content: m.content,
					isRead: m.isRead,
					sentAt: m.sentAt.toISOString(),
				})),
			);
			expect(getDirectMessagesUsecase.execute).toHaveBeenCalledWith({
				senderId: sender.id.value,
				receiverId: receiver.id.value,
			});
		});
	});

	describe("POST /dms", () => {
		it("should send a direct message and return the created message", async () => {
			const sentMessage = new DirectMessage(
				"newMsg",
				sender,
				receiver,
				"Hi there",
				false,
				new Date(),
			);
			sendDirectMessageUsecase.execute.mockResolvedValue(sentMessage);

			const response = await app.inject({
				method: "POST",
				url: "/dms",
				payload: {
					receiverId: receiver.id.value,
					content: "Hi there",
				},
			});

			expect(response.statusCode).toBe(201);
			expect(response.json()).toEqual({
				id: sentMessage.id,
				sender: {
					id: sentMessage.sender.id.value,
					email: sentMessage.sender.email.value,
				},
				receiver: {
					id: sentMessage.receiver.id.value,
					email: sentMessage.receiver.email.value,
				},
				content: sentMessage.content,
				isRead: sentMessage.isRead,
				sentAt: sentMessage.sentAt.toISOString(),
			});
			expect(sendDirectMessageUsecase.execute).toHaveBeenCalledWith({
				senderId: sender.id.value,
				receiverId: receiver.id.value,
				content: "Hi there",
			});
		});

		it("should return 400 if payload is invalid", async () => {
			const response = await app.inject({
				method: "POST",
				url: "/dms",
				payload: {
					receiverId: "receiver123",
					// content is missing
				},
			});

			expect(response.statusCode).toBe(400);
		});
	});
});
