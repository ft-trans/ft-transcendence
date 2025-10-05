// test/controllers/directMessageController.test.ts

import { ErrBadRequest } from "@domain/error";
import { DirectMessage } from "@domain/model/direct_message";
import {
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	UserStatusValue,
} from "@domain/model/user";
import { chatController as apiChatController } from "@presentation/controllers/api/chat_controller";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { GetDirectMessagesUsecase } from "@usecase/chat/get_direct_messages_usecase";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

const sender = User.reconstruct(
	new UserId("01K24DQHXAJ2NFYKPZ812F4HBJ"),
	new UserEmail("sender@example.com"),
	new Username("sender"),
	new UserAvatar(""),
	new UserStatusValue("online"),
);
const receiver = User.reconstruct(
	new UserId("01K24DQHXAJ2NFYKPZ812F4HBK"),
	new UserEmail("receiver@example.com"),
	new Username("receiver"),
	new UserAvatar(""),
	new UserStatusValue("online"),
);
describe("directMessageController", () => {
	let app: FastifyInstance;
	const getDirectMessagesUsecase = mock<GetDirectMessagesUsecase>();
	const sendDirectMessageUsecase = mock<SendDirectMessageUsecase>();

	// Mock auth prehandler that sets authenticatedUser
	const mockAuthPrehandler: AuthPrehandler = async (request, _reply) => {
		request.authenticatedUser = {
			id: sender.id.value,
			email: sender.email.value,
		};
	};

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
		const mockChatClientRepository = {
			add: vi.fn(),
			remove: vi.fn(),
			findByUserId: vi.fn().mockReturnValue(undefined), // Default: receiver is offline
		};
		app.register(
			apiChatController(
				getDirectMessagesUsecase,
				sendDirectMessageUsecase,
				mockAuthPrehandler,
				mockChatClientRepository,
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
					sender: { id: m.sender.id.value, username: m.sender.username.value },
					receiver: {
						id: m.receiver.id.value,
						username: m.receiver.username.value,
					},
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
					username: sentMessage.sender.username.value,
				},
				receiver: {
					id: sentMessage.receiver.id.value,
					username: sentMessage.receiver.username.value,
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
