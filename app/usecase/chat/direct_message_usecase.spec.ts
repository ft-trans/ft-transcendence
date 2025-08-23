import { ErrBadRequest, ErrNotFound } from "@domain/error";
import { DirectMessage } from "@domain/model/direct_message";
import { User, UserEmail } from "@domain/model/user";
import type { IDirectMessageRepository } from "@domain/repository/direct_message_repository";
import type { IFriendshipRepository } from "@domain/repository/friendship_repository";
import type { IUserRepository } from "@domain/repository/user_repository";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { GetDirectMessagesUsecase } from "./get_direct_messages_usecase";
import { SendDirectMessageUsecase } from "./send_direct_message_usecase";

// --- Common Mocks ---
const userRepo = mock<IUserRepository>();
const messageRepo = mock<IDirectMessageRepository>();
const friendshipRepo = mock<IFriendshipRepository>();
const tx = mock<ITransaction>();

const mockRepos = {
	newUserRepository: () => userRepo,
	newDirectMessageRepository: () => messageRepo,
	newFriendshipRepository: () => friendshipRepo,
};
tx.exec.mockImplementation(async (callback) => callback(mockRepos));

beforeEach(() => {
	vi.clearAllMocks();
});

// --- Test Suites ---

describe("SendDirectMessageUsecase", () => {
	const usecase = new SendDirectMessageUsecase(tx);
	const sender = User.create(new UserEmail("sender@test.com"));
	const receiver = User.create(new UserEmail("receiver@test.com"));

	it("should send a message successfully", async () => {
		userRepo.findById
			.mockResolvedValueOnce(sender)
			.mockResolvedValueOnce(receiver);
		friendshipRepo.findByUserIds.mockResolvedValue(null);
		messageRepo.save.mockImplementation(async (msg) => msg);

		const input = {
			senderId: sender.id.value,
			receiverId: receiver.id.value,
			content: "Hello!",
		};
		const message = await usecase.execute(input);

		expect(messageRepo.save).toHaveBeenCalledOnce();
		expect(message.content).toBe(input.content);
		expect(message.sender.id.equals(sender.id)).toBe(true);
	});

	it("should throw ErrBadRequest when sending to oneself", async () => {
		const input = {
			senderId: sender.id.value,
			receiverId: sender.id.value,
			content: "Hello me!",
		};
		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
	});

	it("should throw ErrBadRequest for empty content", async () => {
		const input = {
			senderId: sender.id.value,
			receiverId: receiver.id.value,
			content: "  ",
		};
		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
	});

	it("should throw ErrNotFound if sender does not exist", async () => {
		userRepo.findById
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(receiver);
		const input = {
			senderId: ulid(),
			receiverId: receiver.id.value,
			content: "Hello!",
		};
		await expect(usecase.execute(input)).rejects.toThrow(ErrNotFound);
	});
});

describe("GetDirectMessagesUsecase", () => {
	const usecase = new GetDirectMessagesUsecase(tx);
	const user1 = User.create(new UserEmail("user1@test.com"));
	const user2 = User.create(new UserEmail("user2@test.com"));

	it("should return a list of messages between two users", async () => {
		const messages = [
			DirectMessage.create(user1, user2, "Hi"),
			DirectMessage.create(user2, user1, "Hello back"),
		];
		messageRepo.findMessagesBetweenUsers.mockResolvedValue(messages);

		const result = await usecase.execute({
			userId: user1.id.value,
			correspondentId: user2.id.value,
		});

		expect(result).toHaveLength(2);
		expect(messageRepo.findMessagesBetweenUsers).toHaveBeenCalledWith(
			user1.id.value,
			user2.id.value,
		);
	});

	it("should return an empty array if there are no messages", async () => {
		messageRepo.findMessagesBetweenUsers.mockResolvedValue([]);

		const result = await usecase.execute({
			userId: user1.id.value,
			correspondentId: user2.id.value,
		});

		expect(result).toHaveLength(0);
	});
});
