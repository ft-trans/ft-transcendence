import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutoPresencePrehandler } from "@presentation/hooks/auto_presence_prehandler";
import { createMockRepository } from "@usecase/test_helper";
import { UserId } from "@domain/model/user";
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

describe("AutoPresencePrehandler", () => {
	let mockRepo: ReturnType<typeof createMockRepository>;
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;
	let mockDone: HookHandlerDoneFunction;
	let prehandler: AutoPresencePrehandler;

	beforeEach(() => {
		vi.clearAllMocks();
		
		mockRepo = createMockRepository();
		mockRequest = {
			authenticatedUser: {
				id: "01234567890123456789012345", // Valid ULID format
				email: "test@example.com",
			},
		};
		mockReply = {};
		mockDone = vi.fn();
		
		prehandler = new AutoPresencePrehandler(mockRepo);
	});

	it("should update presence for authenticated user", async () => {
		const extendUserOnlineMock = vi.fn().mockResolvedValue(undefined);
		mockRepo.newUserPresenceRepository().extendUserOnline = extendUserOnlineMock;

		await prehandler.handler(
			mockRequest as FastifyRequest,
			mockReply as FastifyReply,
			mockDone,
		);

		// done が呼ばれることを確認
		expect(mockDone).toHaveBeenCalled();

		// 非同期処理の完了を待つ
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(extendUserOnlineMock).toHaveBeenCalledWith(
			new UserId("01234567890123456789012345"),
			180, // ONLINE_TTL
		);
	});

	it("should skip presence update for unauthenticated user", async () => {
		mockRequest.authenticatedUser = undefined;
		const extendUserOnlineMock = vi.fn().mockResolvedValue(undefined);
		mockRepo.newUserPresenceRepository().extendUserOnline = extendUserOnlineMock;

		await prehandler.handler(
			mockRequest as FastifyRequest,
			mockReply as FastifyReply,
			mockDone,
		);

		expect(mockDone).toHaveBeenCalled();
		
		// プレゼンス更新が呼ばれないことを確認
		await new Promise(resolve => setTimeout(resolve, 100));
		expect(extendUserOnlineMock).not.toHaveBeenCalled();
	});

	it("should respect rate limiting", async () => {
		const extendUserOnlineMock = vi.fn().mockResolvedValue(undefined);
		mockRepo.newUserPresenceRepository().extendUserOnline = extendUserOnlineMock;

		// 2回連続でハンドラーを呼び出し
		await prehandler.handler(
			mockRequest as FastifyRequest,
			mockReply as FastifyReply,
			mockDone,
		);

		await prehandler.handler(
			mockRequest as FastifyRequest,
			mockReply as FastifyReply,
			mockDone,
		);

		// done は2回呼ばれる
		expect(mockDone).toHaveBeenCalledTimes(2);

		// 非同期処理の完了を待つ
		await new Promise(resolve => setTimeout(resolve, 100));
		// プレゼンス更新は1回だけ呼ばれる（レート制限）
		expect(extendUserOnlineMock).toHaveBeenCalledTimes(1);
	});

	it("should handle presence update errors gracefully", async () => {
		const extendUserOnlineMock = vi.fn().mockRejectedValue(new Error("Redis error"));
		mockRepo.newUserPresenceRepository().extendUserOnline = extendUserOnlineMock;

		// エラーが発生してもハンドラーは正常終了すること
		await expect(prehandler.handler(
			mockRequest as FastifyRequest,
			mockReply as FastifyReply,
			mockDone,
		)).resolves.toBeUndefined();

		expect(mockDone).toHaveBeenCalled();
	});

	it("should cleanup cache properly", () => {
		// キャッシュクリーンアップのテスト
		expect(() => AutoPresencePrehandler.cleanupCache()).not.toThrow();
	});
});

describe("AutoPresencePrehandler static methods", () => {
	it("should create handler function", () => {
		const mockRepo = createMockRepository();
		const handler = AutoPresencePrehandler.create(mockRepo);
		
		expect(typeof handler).toBe("function");
	});
});