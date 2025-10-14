import { UserId } from "@domain/model/user";
import type { IUserPresenceRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { SetUserOnlineUsecase } from "./set_user_online_usecase";

const mockRepo = createMockRepository();

describe("SetUserOnlineUsecase", () => {
	let usecase: SetUserOnlineUsecase;
	let presenceRepo: ReturnType<typeof mock<IUserPresenceRepository>>;

	beforeEach(() => {
		vi.clearAllMocks();
		presenceRepo = mock<IUserPresenceRepository>();
		mockRepo.newUserPresenceRepository = () => presenceRepo;
		usecase = new SetUserOnlineUsecase(mockRepo);
	});

	it("should set user online", async () => {
		const userId = "01234567890123456789012345";

		await usecase.execute(userId);

		expect(presenceRepo.setUserOnline).toHaveBeenCalledWith(
			new UserId(userId),
			undefined,
		);
	});

	it("should set user online with custom TTL", async () => {
		const userId = "01234567890123456789012345";
		const ttl = 600;

		await usecase.execute(userId, ttl);

		expect(presenceRepo.setUserOnline).toHaveBeenCalledWith(
			new UserId(userId),
			ttl,
		);
	});
});
