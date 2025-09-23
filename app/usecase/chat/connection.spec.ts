import type { IChatClientRepository } from "@domain/repository/chat_client_repository";
import type { IChatClient } from "@domain/service/chat_client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { JoinChatUsecase } from "./join_chat_usecase";
import { LeaveChatUsecase } from "./leave_chat_usecase";

const chatClientRepo = mock<IChatClientRepository>();
const chatClient = mock<IChatClient>();

beforeEach(() => {
	vi.clearAllMocks();
});

describe("JoinChatUsecase", () => {
	const usecase = new JoinChatUsecase(chatClientRepo);

	it("should add a client to the repository", () => {
		usecase.execute(chatClient);
		expect(chatClientRepo.add).toHaveBeenCalledWith(chatClient);
		expect(chatClientRepo.add).toHaveBeenCalledOnce();
	});
});

describe("LeaveChatUsecase", () => {
	const usecase = new LeaveChatUsecase(chatClientRepo);

	it("should remove a client from the repository", () => {
		usecase.execute(chatClient);
		expect(chatClientRepo.remove).toHaveBeenCalledWith(chatClient);
		expect(chatClientRepo.remove).toHaveBeenCalledOnce();
	});
});
