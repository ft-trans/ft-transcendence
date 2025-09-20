import { DirectMessage } from "@domain/model/direct_message";
import { User, UserEmail } from "@domain/model/user";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { ChatClient } from "@domain/service/chat_client";
import type { SendDirectMessageUsecase } from "@usecase/chat/send_direct_message_usecase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { SendChatMessageUsecase } from "./send_chat_message_usecase";

const sendDirectMessageUsecase = mock<SendDirectMessageUsecase>();
const chatClientRepo = mock<IChatClientRepository>();
const receiverClient = mock<ChatClient>();

beforeEach(() => {
	vi.clearAllMocks();
});

describe("SendChatMessageUsecase", () => {
	const usecase = new SendChatMessageUsecase(
		sendDirectMessageUsecase,
		chatClientRepo,
	);
	const sender = User.create(new UserEmail("sender@test.com"));
	const receiver = User.create(new UserEmail("receiver@test.com"));
	const message = DirectMessage.create(sender, receiver, "Hello!");

	const input = {
		senderId: sender.id.value,
		content: message.content,
		receiverId: receiver.id.value,
	};

	it("should save message and send to online receiver", async () => {
		sendDirectMessageUsecase.execute.mockResolvedValue(message);
		chatClientRepo.findByUserId.mockReturnValue(receiverClient);

		await usecase.execute(input);

		expect(sendDirectMessageUsecase.execute).toHaveBeenCalledWith(input);
		expect(chatClientRepo.findByUserId).toHaveBeenCalledWith(receiver.id);
		expect(receiverClient.send).toHaveBeenCalledWith({
			type: "newMessage",
			payload: {
				senderId: sender.id.value,
				senderEmail: sender.email.value,
				content: message.content,
				timestamp: message.sentAt.toISOString(),
			},
		});
	});

	it("should only save message if receiver is offline", async () => {
		sendDirectMessageUsecase.execute.mockResolvedValue(message);
		chatClientRepo.findByUserId.mockReturnValue(undefined);

		await usecase.execute(input);

		expect(sendDirectMessageUsecase.execute).toHaveBeenCalledWith(input);
		expect(chatClientRepo.findByUserId).toHaveBeenCalledWith(receiver.id);
		expect(receiverClient.send).not.toHaveBeenCalled();
	});
});
