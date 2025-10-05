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

class AuthStore {
	private state: AuthState = {
		isAuthenticated: false,
		loading: true,
	};

	private listeners: Set<(state: AuthState) => void> = new Set();
	private heartbeatInterval: number | null = null;
	private apiClient = new ApiClient();

	constructor() {
		// ページの可視性変更を監視
		if (typeof document !== "undefined") {
			document.addEventListener("visibilitychange", () => {
				if (this.state.isAuthenticated) {
					if (document.hidden) {
						// ページが非表示になった場合はハートビートを停止
						this.stopHeartbeat();
					} else {
						// ページが表示された場合はハートビートを再開
						this.startHeartbeat();
					}
				}
			});

			// ページ離脱時にオフライン状態に設定
			window.addEventListener("beforeunload", () => {
				if (this.state.isAuthenticated) {
					this.setOfflineStatus();
				}
			});

			// ページを離れる時にもオフライン状態に設定
			window.addEventListener("pagehide", () => {
				if (this.state.isAuthenticated) {
					this.setOfflineStatus();
				}
			});
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
		this.startHeartbeat();
	}

	clearUser(): void {
		// ログアウト時にオフライン状態に設定
		if (this.state.isAuthenticated) {
			this.setOfflineStatus();
		}

		this.state = {
			isAuthenticated: false,
			loading: false,
		};
		this.notify();
		this.stopHeartbeat();
	}

	setLoading(loading: boolean): void {
		this.state = {
			...this.state,
			loading,
		};
		this.notify();
	}

	private startHeartbeat(): void {
		// 既存のハートビートがあれば停止
		this.stopHeartbeat();

		// ログイン時に即座にオンライン状態に設定
		this.setOnlineStatus();

		// 1分ごとにハートビートを送信してオンライン状態を延長
		this.heartbeatInterval = window.setInterval(() => {
			this.sendHeartbeat();
		}, 60000); // 60秒 = 1分
	}

	private stopHeartbeat(): void {
		if (this.heartbeatInterval !== null) {
			window.clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	private async setOnlineStatus(): Promise<void> {
		try {
			await this.apiClient.post("/api/presence/online", {});
			console.log("[AuthStore] User set to online");
		} catch (error) {
			console.error("[AuthStore] Failed to set user online:", error);
		}
	}

	private async sendHeartbeat(): Promise<void> {
		if (!this.state.isAuthenticated) {
			return;
		}

		try {
			await this.apiClient.post("/api/presence/heartbeat", {});
			console.log("[AuthStore] Heartbeat sent successfully");
		} catch (error) {
			console.error("[AuthStore] Heartbeat failed:", error);
			// ハートビートが連続で失敗した場合はハートビートを停止
			// （サーバー接続が切れた、セッションが無効など）
			this.stopHeartbeat();
		}
	}

	private async setOfflineStatus(): Promise<void> {
		try {
			// navigator.sendBeaconで同期的に送信（ページ離脱時に確実に送信）
			if (navigator.sendBeacon) {
				const data = new Blob([JSON.stringify({})], {
					type: "application/json",
				});
				navigator.sendBeacon("/api/presence/offline", data);
				console.log("[AuthStore] User set to offline via beacon");
			} else {
				// フォールバック: 通常のHTTPリクエスト
				await this.apiClient.post("/api/presence/offline", {});
				console.log("[AuthStore] User set to offline");
			}
		} catch (error) {
			console.error("[AuthStore] Failed to set user offline:", error);
		}
	}
}

export const authStore = new AuthStore();
