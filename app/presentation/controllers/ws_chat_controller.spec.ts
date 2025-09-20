// test/controllers/webSocketController.test.ts

import fastifyWebsocket from "@fastify/websocket";
import { webSocketChatController } from "@presentation/controllers/ws_chat_controller";
import type { JoinChatUsecase } from "@usecase/chat/join_chat_usecase";
import type { LeaveChatUsecase } from "@usecase/chat/leave_chat_usecase";
import type { SendChatMessageUsecase } from "@usecase/chat/send_chat_message_usecase";
import type { SendGameInviteUsecase } from "@usecase/chat/send_game_invite_usecase";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

describe("webSocketController", () => {
	let app: FastifyInstance;
	const joinChatUsecase = mock<JoinChatUsecase>();
	const leaveChatUsecase = mock<LeaveChatUsecase>();
	const sendChatMessageUsecase = mock<SendChatMessageUsecase>();
	const sendGameInviteUsecase = mock<SendGameInviteUsecase>();

	beforeEach(async () => {
		app = Fastify();
		await app.register(fastifyWebsocket);
		app.register(
			webSocketChatController(
				joinChatUsecase,
				leaveChatUsecase,
				sendChatMessageUsecase,
				sendGameInviteUsecase,
			),
		);
		await app.ready();
	});

	afterEach(async () => {
		vi.clearAllMocks();
		await app.close();
	});

	describe("GET /chat", () => {
		it("should handle WebSocket connections", () => {
			// TODO
		});
	});
});
