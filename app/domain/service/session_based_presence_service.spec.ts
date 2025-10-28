import { describe, it, expect, beforeEach, vi } from "vitest";
import { SessionBasedPresenceService } from "@domain/service/session_based_presence_service";
import { createMockRepository } from "@usecase/test_helper";

describe("SessionBasedPresenceService", () => {
	let service: SessionBasedPresenceService;
	let mockRepo: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		vi.clearAllMocks();
		mockRepo = createMockRepository();
		service = new SessionBasedPresenceService(mockRepo);
	});

	describe("Session Management", () => {
		it("should start session and set user online", async () => {
			const setUserOnlineMock = vi.fn();
			mockRepo.newUserPresenceRepository().setUserOnline = setUserOnlineMock;

			await service.onSessionStart("user123", "session-token-456");

			expect(setUserOnlineMock).toHaveBeenCalledWith({ value: "user123" });
		});

		it("should end session and set user offline when no other sessions", async () => {
			const setUserOfflineMock = vi.fn();
			mockRepo.newUserPresenceRepository().setUserOffline = setUserOfflineMock;

			// まずセッションを開始
			await service.onSessionStart("user123", "session-token-456");
			
			// セッションを終了
			await service.onSessionEnd("session-token-456");

			expect(setUserOfflineMock).toHaveBeenCalledWith({ value: "user123" });
		});

		it("should not set user offline when other active sessions exist", async () => {
			const setUserOfflineMock = vi.fn();
			mockRepo.newUserPresenceRepository().setUserOffline = setUserOfflineMock;

			// 同じユーザーで2つのセッションを開始
			await service.onSessionStart("user123", "session-token-1");
			await service.onSessionStart("user123", "session-token-2");
			
			// 1つのセッションを終了
			await service.onSessionEnd("session-token-1");

			// オフラインに設定されないことを確認
			expect(setUserOfflineMock).not.toHaveBeenCalled();
		});

		it("should update session activity", async () => {
			const extendUserOnlineMock = vi.fn();
			mockRepo.newUserPresenceRepository().extendUserOnline = extendUserOnlineMock;

			// セッション開始
			await service.onSessionStart("user123", "session-token-456");
			
			// アクティビティ更新
			await service.updateSessionActivity("session-token-456");

			expect(extendUserOnlineMock).toHaveBeenCalledWith({ value: "user123" });
		});
	});

	describe("Online Status Checking", () => {
		it("should return true for user with active recent session", async () => {
			// セッション開始
			await service.onSessionStart("user123", "session-token-456");
			
			const isOnline = await service.isUserOnlineWithSession("user123");
			expect(isOnline).toBe(true);
		});

		it("should fall back to Redis when no active session", async () => {
			const isUserOnlineMock = vi.fn().mockResolvedValue(true);
			mockRepo.newUserPresenceRepository().isUserOnline = isUserOnlineMock;

			const isOnline = await service.isUserOnlineWithSession("user456");
			
			expect(isOnline).toBe(true);
			expect(isUserOnlineMock).toHaveBeenCalledWith({ value: "user456" });
		});

		it("should get online users including session-based ones", async () => {
			const getOnlineUsersMock = vi.fn().mockResolvedValue([{ value: "redis-user" }]);
			mockRepo.newUserPresenceRepository().getOnlineUsers = getOnlineUsersMock;

			// セッション開始
			await service.onSessionStart("session-user", "session-token-456");
			
			const onlineUsers = await service.getOnlineUsersWithSession();
			
			expect(onlineUsers).toContain("session-user");
			expect(onlineUsers).toContain("redis-user");
		});
	});

	describe("Session Statistics", () => {
		it("should return correct session stats", async () => {
			// セッション開始
			await service.onSessionStart("user1", "session1");
			await service.onSessionStart("user2", "session2");
			
			const stats = service.getSessionStats();
			
			expect(stats.totalSessions).toBe(2);
			expect(stats.activeSessions).toBe(2);
			expect(stats.recentActiveSessions).toBe(2);
		});
	});

	describe("Error Handling", () => {
		it("should handle Redis errors gracefully during session start", async () => {
			const setUserOnlineMock = vi.fn().mockRejectedValue(new Error("Redis error"));
			mockRepo.newUserPresenceRepository().setUserOnline = setUserOnlineMock;

			// エラーが発生してもPromiseは正常終了すること
			await expect(service.onSessionStart("user123", "session-token-456"))
				.resolves.toBeUndefined();
		});

		it("should handle Redis errors gracefully during session end", async () => {
			const setUserOfflineMock = vi.fn().mockRejectedValue(new Error("Redis error"));
			mockRepo.newUserPresenceRepository().setUserOffline = setUserOfflineMock;

			// セッション開始後にエラー発生
			await service.onSessionStart("user123", "session-token-456");
			
			// エラーが発生してもPromiseは正常終了すること
			await expect(service.onSessionEnd("session-token-456"))
				.resolves.toBeUndefined();
		});
	});
});