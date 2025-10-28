/**
 * セッションベースのプレゼンス管理サービス
 * セッション情報とオンライン状態を統合管理し、
 * より効率的で信頼性の高いプレゼンス管理を提供
 */

import type { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";

export interface SessionInfo {
	userId: string;
	sessionToken: string;
	lastActivity: Date;
	isActive: boolean;
}

export class SessionBasedPresenceService {
	// アクティブセッションの管理
	private activeSessions = new Map<string, SessionInfo>();

	// クリーンアップタイマーのID
	private cleanupIntervalId: NodeJS.Timeout | null = null;

	// オンライン判定の閾値（秒）
	private static readonly ONLINE_THRESHOLD = 300; // 5分

	constructor(private readonly repository: IRepository) {
		// 定期的なクリーンアップを開始
		this.startCleanupTimer();
	}

	/**
	 * セッション開始時の処理
	 */
	async onSessionStart(userId: string, sessionToken: string): Promise<void> {
		const sessionInfo: SessionInfo = {
			userId,
			sessionToken,
			lastActivity: new Date(),
			isActive: true,
		};

		this.activeSessions.set(sessionToken, sessionInfo);

		// オンライン状態を設定
		await this.setUserOnline(userId);

		console.log(`[SessionPresence] Session started for user ${userId}`);
	}

	/**
	 * セッション終了時の処理
	 */
	async onSessionEnd(sessionToken: string): Promise<void> {
		const sessionInfo = this.activeSessions.get(sessionToken);

		if (sessionInfo) {
			// 同じユーザーの他のアクティブセッションがあるかチェック
			const hasOtherActiveSessions = Array.from(
				this.activeSessions.values(),
			).some(
				(session) =>
					session.userId === sessionInfo.userId &&
					session.sessionToken !== sessionToken &&
					session.isActive,
			);

			// 他のアクティブセッションがない場合のみオフラインに
			if (!hasOtherActiveSessions) {
				await this.setUserOffline(sessionInfo.userId);
			}

			this.activeSessions.delete(sessionToken);
			console.log(
				`[SessionPresence] Session ended for user ${sessionInfo.userId}`,
			);
		}
	}

	/**
	 * セッションのアクティビティを更新
	 */
	async updateSessionActivity(sessionToken: string): Promise<void> {
		const sessionInfo = this.activeSessions.get(sessionToken);

		if (sessionInfo?.isActive) {
			sessionInfo.lastActivity = new Date();

			// オンライン状態を延長
			await this.extendUserOnline(sessionInfo.userId);
		}
	}

	/**
	 * ユーザーがオンラインかどうかをセッション情報も含めて判定
	 */
	async isUserOnlineWithSession(userId: string): Promise<boolean> {
		// アクティブセッションをチェック
		const hasActiveSession = Array.from(this.activeSessions.values()).some(
			(session) =>
				session.userId === userId &&
				session.isActive &&
				this.isRecentActivity(session.lastActivity),
		);

		if (hasActiveSession) {
			return true;
		}

		// フォールバック: Redis上のオンライン状態をチェック
		const presenceRepo = this.repository.newUserPresenceRepository();
		return await presenceRepo.isUserOnline({ value: userId } as UserId);
	}

	/**
	 * 全てのオンラインユーザーをセッション情報も含めて取得
	 */
	async getOnlineUsersWithSession(): Promise<string[]> {
		// アクティブセッションから取得
		const sessionBasedOnlineUsers = Array.from(this.activeSessions.values())
			.filter(
				(session) =>
					session.isActive && this.isRecentActivity(session.lastActivity),
			)
			.map((session) => session.userId);

		// Redis上のオンライン状態からも取得
		const presenceRepo = this.repository.newUserPresenceRepository();
		const presenceBasedOnlineUsers = await presenceRepo.getOnlineUsers();

		// 重複を除去してマージ
		const allOnlineUsers = new Set([
			...sessionBasedOnlineUsers,
			...presenceBasedOnlineUsers.map((id) => id.value),
		]);

		return Array.from(allOnlineUsers);
	}

	/**
	 * セッション情報の統計を取得（デバッグ用）
	 */
	getSessionStats() {
		const totalSessions = this.activeSessions.size;
		const activeSessions = Array.from(this.activeSessions.values()).filter(
			(session) => session.isActive,
		).length;
		const recentActiveSessions = Array.from(
			this.activeSessions.values(),
		).filter(
			(session) =>
				session.isActive && this.isRecentActivity(session.lastActivity),
		).length;

		return {
			totalSessions,
			activeSessions,
			recentActiveSessions,
		};
	}

	private async setUserOnline(userId: string): Promise<void> {
		try {
			const presenceRepo = this.repository.newUserPresenceRepository();
			await presenceRepo.setUserOnline({ value: userId } as UserId);
		} catch (error) {
			console.error(
				`[SessionPresence] Failed to set user ${userId} online:`,
				error,
			);
		}
	}

	private async setUserOffline(userId: string): Promise<void> {
		try {
			const presenceRepo = this.repository.newUserPresenceRepository();
			await presenceRepo.setUserOffline({ value: userId } as UserId);
		} catch (error) {
			console.error(
				`[SessionPresence] Failed to set user ${userId} offline:`,
				error,
			);
		}
	}

	private async extendUserOnline(userId: string): Promise<void> {
		try {
			const presenceRepo = this.repository.newUserPresenceRepository();
			await presenceRepo.extendUserOnline({ value: userId } as UserId);
		} catch (error) {
			console.error(
				`[SessionPresence] Failed to extend user ${userId} online:`,
				error,
			);
		}
	}

	private isRecentActivity(lastActivity: Date): boolean {
		const now = new Date();
		const diffSeconds = (now.getTime() - lastActivity.getTime()) / 1000;
		return diffSeconds <= SessionBasedPresenceService.ONLINE_THRESHOLD;
	}

	/**
	 * 定期的なクリーンアップタイマーを開始
	 */
	private startCleanupTimer(): void {
		this.cleanupIntervalId = setInterval(() => {
			this.cleanupInactiveSessions();
		}, 60000); // 1分ごと
	}

	/**
	 * サービスのクリーンアップ
	 */
	destroy(): void {
		if (this.cleanupIntervalId) {
			clearInterval(this.cleanupIntervalId);
			this.cleanupIntervalId = null;
		}
		this.activeSessions.clear();
	}

	/**
	 * 非アクティブなセッションをクリーンアップ
	 */
	private cleanupInactiveSessions(): void {
		const now = new Date();
		const sessionsToRemove: string[] = [];

		for (const [sessionToken, sessionInfo] of this.activeSessions.entries()) {
			const diffSeconds =
				(now.getTime() - sessionInfo.lastActivity.getTime()) / 1000;

			// 閾値を超えた場合は非アクティブとしてマーク
			if (diffSeconds > SessionBasedPresenceService.ONLINE_THRESHOLD) {
				sessionInfo.isActive = false;
			}

			// さらに長時間経過した場合はセッション情報を削除
			if (diffSeconds > SessionBasedPresenceService.ONLINE_THRESHOLD * 2) {
				sessionsToRemove.push(sessionToken);
			}
		}

		// セッション情報の削除
		for (const sessionToken of sessionsToRemove) {
			const sessionInfo = this.activeSessions.get(sessionToken);
			if (sessionInfo) {
				// 他のアクティブセッションがない場合はオフラインに設定
				const hasOtherActiveSessions = Array.from(
					this.activeSessions.values(),
				).some(
					(session) =>
						session.userId === sessionInfo.userId &&
						session.sessionToken !== sessionToken &&
						session.isActive,
				);

				if (!hasOtherActiveSessions) {
					this.setUserOffline(sessionInfo.userId).catch((error) => {
						console.error(
							`[SessionPresence] Cleanup offline error for user ${sessionInfo.userId}:`,
							error,
						);
					});
				}
			}

			this.activeSessions.delete(sessionToken);
		}

		if (sessionsToRemove.length > 0) {
			console.log(
				`[SessionPresence] Cleaned up ${sessionsToRemove.length} inactive sessions`,
			);
		}
	}
}
