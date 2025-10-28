import { ApiClient } from "../api/api_client";

type User = {
	id: string;
	email: string;
	username?: string;
};

type AuthState = {
	isAuthenticated: boolean;
	user?: User;
	loading: boolean;
};

/**
 * 改善されたAuthStore
 * - 専用heartbeatを廃止し、通常のAPIリクエストベースの状態管理に移行
 * - Page Visibility APIを活用した効率的なプレゼンス管理
 * - セッションベースの統合管理
 */
class EnhancedAuthStore {
	private state: AuthState = {
		isAuthenticated: false,
		loading: true,
	};

	private listeners: Set<(state: AuthState) => void> = new Set();
	private apiClient = new ApiClient();

	// Page Visibility状態管理
	private isPageVisible = true;
	private visibilityChangeHandler = this.handleVisibilityChange.bind(this);
	private beforeUnloadHandler = this.handleBeforeUnload.bind(this);
	private pageHideHandler = this.handlePageHide.bind(this);

	// 状態同期用のタイマー
	private statusSyncInterval: number | null = null;
	private readonly STATUS_SYNC_INTERVAL = 300000; // 5分ごと（フォールバック）

	constructor() {
		if (typeof document !== "undefined") {
			// Page Visibility API の監視
			document.addEventListener(
				"visibilitychange",
				this.visibilityChangeHandler,
			);

			// ページ離脱時のイベント
			window.addEventListener("beforeunload", this.beforeUnloadHandler);
			window.addEventListener("pagehide", this.pageHideHandler);

			// 初期表示状態を設定
			this.isPageVisible = !document.hidden;
		}
	}

	subscribe(listener: (state: AuthState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((listener) => listener(this.state));
	}

	getState(): AuthState {
		return this.state;
	}

	setUser(user: User): void {
		this.state = {
			isAuthenticated: true,
			user,
			loading: false,
		};
		this.notify();

		// ログイン時にオンライン状態を設定（サーバー側で自動処理）
		this.startStatusSync();
	}

	clearUser(): void {
		// ログアウト時の処理（サーバー側で自動的にオフライン化）
		this.state = {
			isAuthenticated: false,
			loading: false,
		};
		this.notify();
		this.stopStatusSync();
	}

	setLoading(loading: boolean): void {
		this.state = {
			...this.state,
			loading,
		};
		this.notify();
	}

	/**
	 * ページ可視性変更の処理
	 */
	private handleVisibilityChange(): void {
		const wasVisible = this.isPageVisible;
		this.isPageVisible = !document.hidden;

		if (this.state.isAuthenticated) {
			if (this.isPageVisible && !wasVisible) {
				// ページが表示されたとき：通常のAPIリクエストで状態が自動更新される
				console.log("[EnhancedAuthStore] Page became visible");

				// 念のため状態同期APIを呼び出し
				this.syncStatusIfNeeded();
			} else if (!this.isPageVisible && wasVisible) {
				// ページが非表示になったとき：特別な処理は不要
				// サーバー側のTTLが自然に期限切れになる
				console.log("[EnhancedAuthStore] Page became hidden");
			}
		}
	}

	/**
	 * ページ離脱前の処理
	 */
	private handleBeforeUnload(): void {
		if (this.state.isAuthenticated) {
			// navigator.sendBeacon で確実にオフライン通知を送信
			this.sendOfflineBeacon();
		}
	}

	/**
	 * ページ非表示時の処理
	 */
	private handlePageHide(): void {
		if (this.state.isAuthenticated) {
			// モバイル端末などでのページ非表示
			this.sendOfflineBeacon();
		}
	}

	/**
	 * Beaconを使った確実なオフライン通知
	 */
	private sendOfflineBeacon(): void {
		try {
			if (navigator.sendBeacon) {
				const data = new Blob([JSON.stringify({})], {
					type: "application/json",
				});
				const success = navigator.sendBeacon("/api/presence/offline", data);
				console.log(`[EnhancedAuthStore] Offline beacon sent: ${success}`);
			}
		} catch (error) {
			console.error(
				"[EnhancedAuthStore] Failed to send offline beacon:",
				error,
			);
		}
	}

	/**
	 * 必要に応じて状態同期
	 */
	private async syncStatusIfNeeded(): Promise<void> {
		if (!this.state.isAuthenticated || !this.isPageVisible) {
			return;
		}

		try {
			// 軽量なAPI呼び出しで状態同期（例：認証状態確認）
			await this.apiClient.get("/api/auth/status");
			console.log("[EnhancedAuthStore] Status sync completed");
		} catch (error) {
			console.error("[EnhancedAuthStore] Status sync failed:", error);
		}
	}

	/**
	 * フォールバック用の定期状態同期を開始
	 */
	private startStatusSync(): void {
		this.stopStatusSync();

		// 5分ごとに軽量なAPIリクエストで状態確認（フォールバック）
		this.statusSyncInterval = window.setInterval(() => {
			if (this.isPageVisible) {
				this.syncStatusIfNeeded();
			}
		}, this.STATUS_SYNC_INTERVAL);
	}

	/**
	 * 定期状態同期を停止
	 */
	private stopStatusSync(): void {
		if (this.statusSyncInterval !== null) {
			window.clearInterval(this.statusSyncInterval);
			this.statusSyncInterval = null;
		}
	}

	/**
	 * クリーンアップ処理
	 */
	destroy(): void {
		if (typeof document !== "undefined") {
			document.removeEventListener(
				"visibilitychange",
				this.visibilityChangeHandler,
			);
			window.removeEventListener("beforeunload", this.beforeUnloadHandler);
			window.removeEventListener("pagehide", this.pageHideHandler);
		}
		this.stopStatusSync();
	}
}

export const enhancedAuthStore = new EnhancedAuthStore();

// 後方互換性のため既存のexportも残す
export { enhancedAuthStore as authStore };
