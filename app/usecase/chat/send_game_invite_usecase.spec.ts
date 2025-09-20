import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { User, UserEmail } from "@domain/model/user";
import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import type { ChatClient } from "@domain/service/chat_client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { SendGameInviteUsecase } from "./send_game_invite_usecase";

const userRepo = mock<IUserRepository>();
const chatClientRepo = mock<IChatClientRepository>();
const receiverClient = mock<ChatClient>();

beforeEach(() => {
	vi.clearAllMocks();
});

describe("SendGameInviteUsecase", () => {
	const usecase = new SendGameInviteUsecase(userRepo, chatClientRepo);
	const sender = User.create(new UserEmail("sender@test.com"));
	const receiver = User.create(new UserEmail("receiver@test.com"));

	const input = {
		senderId: sender.id.value,
		receiverId: receiver.id.value,
	};

	it("should send game invite to online receiver", async () => {
		userRepo.findById.mockResolvedValue(sender);
		chatClientRepo.findByUserId.mockReturnValue(receiverClient);

		await usecase.execute(input);

		expect(userRepo.findById).toHaveBeenCalledWith(sender.id);
		expect(chatClientRepo.findByUserId).toHaveBeenCalledWith(receiver.id);
		expect(receiverClient.send).toHaveBeenCalledWith({
			type: "gameInvite",
			payload: {
				senderId: sender.id.value,
				senderEmail: sender.email.value,
			},
		});
	});

	it("should not send game invite if receiver is offline", async () => {
		userRepo.findById.mockResolvedValue(sender);
		chatClientRepo.findByUserId.mockReturnValue(undefined);

		await usecase.execute(input);

		expect(userRepo.findById).toHaveBeenCalledWith(sender.id);
		expect(chatClientRepo.findByUserId).toHaveBeenCalledWith(receiver.id);
		expect(receiverClient.send).not.toHaveBeenCalled();
	});

	it("should throw ErrBadRequest when sending to oneself", async () => {
		const selfInput = {
			senderId: sender.id.value,
			receiverId: sender.id.value,
		};
		await expect(usecase.execute(selfInput)).rejects.toThrow(ErrBadRequest);
	});

	it("should throw ErrNotFound if sender does not exist", async () => {
		userRepo.findById.mockResolvedValue(undefined);
		await expect(usecase.execute(input)).rejects.toThrow(ErrNotFound);
	});
});
