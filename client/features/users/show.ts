import type {
	GetMatchHistoriesResponse,
	GetProfileResponse,
	GetUserStatsResponse,
	MatchHistoryResponse,
} from "@shared/api/profile";
import { ApiClient } from "client/api/api_client";
import {
	Component,
	FloatingBanner,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { authStore } from "client/store/auth_store";

export class UserProfile extends Component {
	private userId: string | undefined = undefined;
	private apiClient = new ApiClient();
	private clickHandler: ((event: Event) => void) | null = null;

	async onLoad(params: RouteParams): Promise<void> {
		try {
			await this.renderProfile(params.username);
		} catch (_error) {
			new FloatingBanner({
				message: "ユーザーが存在しません。",
				type: "error",
			}).show();
			// Navigate to 404 page - redirect to home for now
			setTimeout(() => {
				window.location.href = "/";
			}, 2000);
		}
		this.renderStats();
		this.renderHistories();
		this.setupEventListeners();
	}

	render(): string {
		return `
		<div id="user-profile">
			${new SectionTitle({ text: "ユーザー情報" }).render()}
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4 ">
				<div id="user-profile-content" class="flex flex-col items-center">
					${this.loadingProfile()}
				</div>
			</div>
		</div>
		<div id="match-stats" class="mt-8">
			${new SectionTitle({ text: "勝敗" }).render()}
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
				<div id="match-stats-content">
					${this.loadingStats()}
				</div>
			</div>
		</div>
		<div id="match-histories" class="mt-8">
			${new SectionTitle({ text: "対戦履歴" }).render()}
			<div class="mx-auto text-center mb-2">
				<p class="text-sm text-gray-500">直近20試合まで表示されます。</p>
			</div>
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
				<div id="match-histories-content">
					${this.loadingHistories()}
				</div>
			</div>
		</div>
        `;
	}

	private loadingProfile(): string {
		return `
		<div class="bg-gray-400 animate-pulse h-30 w-30 rounded-full mb-2"></div>
		<div class="bg-gray-400 animate-pulse h-16 w-sm mb-2"></div>
		`;
	}

	private loadingStats(): string {
		return `
		<div class="grid grid-cols-2 gap-4 text-center">
			<div><p>総試合数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
			<div><p>勝率</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
			<div><p>勝利数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
			<div><p>敗北数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
		</div>
		`;
	}

	private loadingHistories(): string {
		return `
		<div class="border-b border-gray-200 pb-2 mb-2 overflow-hidden">
			<div class="flex items-center justify-between mb-1">
				<p class="text-sm text-gray-500 bg-gray-400 animate-pulse h-4 w-50"></p>
				<p class="text-sm text-gray-500 bg-gray-400 animate-pulse h-4 w-50"></p>
			</div>
			<div class="text-md text-center flex items-center justify-center gap-4">
				<div class="w-1/3 text-right truncate">
					<p class="font-bold text-gray-600 bg-gray-400 animate-pulse h-12 w-30 ml-auto"></p>
				</div>
				<div class="flex items-center">
					<div class="w-10 h-10 rounded-full bg-gray-400 inline-block mx-1 animate-pulse "></div>
				</div>
				<div class="text-4xl">
					vs
				</div>
				<div class="flex items-center">
					<div class="w-10 h-10 rounded-full bg-gray-400 inline-block mx-1 animate-pulse "></div>
				</div>
				<div class="w-1/3 text-left truncate">
					<p class="font-bold text-gray-600 bg-gray-400 animate-pulse h-12 w-30 mr-auto"></p>
				</div>
			</div>
		</div>
		`.repeat(5);
	}

	private async renderProfile(username: string): Promise<void> {
		const state = authStore.getState();
		const url =
			username === "me" && state.isAuthenticated && state.user
				? `/api/users/${state.user.id}`
				: `/api/users/username/${username}`;
		const user = await this.apiClient.get<GetProfileResponse["user"]>(url);

		this.userId = user.id;
		let isCurrentUser = false;
		if (state.isAuthenticated && state.user) {
			isCurrentUser = state.user.id === user.id;
		}
		const element = document.getElementById("user-profile-content");
		if (!element) {
			return;
		}
		// アバター画像のパス処理を修正
		const defaultAvatar = "/avatars/default.svg";
		let avatarUrl = defaultAvatar;
		if (user.avatar?.trim()) {
			// アバターパスが既に/avatars/で始まっている場合はそのまま使用
			avatarUrl = user.avatar.startsWith("/avatars/")
				? user.avatar
				: `/avatars/${user.avatar}`;
		}

		element.innerHTML = `
		<img 
			src="${avatarUrl}" 
			alt="${user.username}のアバター" 
			class="w-30 h-30 rounded-full mb-2 object-cover border-4 border-gray-200"
			onerror="this.src='${defaultAvatar}'"
		>
		<h2 class="text-2xl font-bold mb-2">${user.username}</h2>
		${isCurrentUser ? `<p class="text-gray-600 mb-4">${state.user?.email}</p>` : ``}
		<div class="flex gap-2 mt-4">
			${
				isCurrentUser
					? `<a href="/profile/edit" data-link class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">プロフィール編集</a>`
					: `
						<a href="/messages" data-link class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">💬 メッセージ</a>
						<button id="block-user-btn" data-user-id="${user.id}" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">🚫 ブロック</button>
					`
			}
		</div>
		`;
	}

	private async renderStats(): Promise<void> {
		if (!this.userId) {
			return;
		}
		const stats = await this.apiClient.get<GetUserStatsResponse["stats"]>(
			`/api/users/${this.userId}/stats`,
		);
		const element = document.getElementById("match-stats-content");
		if (!element) {
			return;
		}
		element.innerHTML = `
		<div class="grid grid-cols-2 gap-4 text-center">
			<div><p>総試合数</p> <p class="text-3xl font-bold">${stats.totalMatches}</p></div>
			<div><p>勝率</p> <p class="text-3xl font-bold">${(stats.winRate * 100).toFixed(2)}%</p></div>
			<div><p>勝利数</p> <p class="text-3xl font-bold">${stats.wins}</p></div>
			<div><p>敗北数</p> <p class="text-3xl font-bold">${stats.losses}</p></div>
		</div>
		`;
	}

	private async renderHistories(): Promise<void> {
		if (!this.userId) {
			return;
		}
		const histories = await this.apiClient.get<GetMatchHistoriesResponse>(
			`/api/users/${this.userId}/match-histories?page=1`,
		);
		const element = document.getElementById("match-histories-content");
		if (!element) {
			return;
		}
		if (histories.histories.length === 0) {
			element.innerHTML = `<p class="text-center text-gray-600">対戦履歴がありません。</p>`;
			return;
		}
		element.innerHTML = `
		<ul>
			${histories.histories
				.map((history) => this.historyItem(history))
				.join("")}
		</ul>
		`;
	}

	private historyItem(history: MatchHistoryResponse): string {
		return `
		<div class="border-b border-gray-200 pb-2 mb-2 overflow-hidden">
			<div class="flex items-center justify-between mb-1">
				<p class="text-sm text-gray-500">${new Date(history.playedAt).toLocaleString()}</p>
				<p class="text-sm text-gray-500">試合ID: ${history.matchId}</p>
			</div>
			<div class="text-md text-center flex items-center justify-center gap-4">
				<div class="w-1/3 text-right truncate">
					<p class="font-bold ${history.winnerId === this.userId ? "text-green-600" : "text-gray-600"}">
						${this.profileLink(history.winner.username)}
					</p>
					<p class="text-md text-gray-500">${history.winnerScore}</p>
				</div>
				${this.renderPlayerAvatar(history.winner)}
				<div class="text-4xl">
					vs
				</div>
				${this.renderPlayerAvatar(history.loser)}
				<div class="w-1/3 text-left truncate">
					<p class="font-bold ${history.loserId === this.userId ? "text-red-600" : "text-gray-600"}">
						${this.profileLink(history.loser.username)}
					</p>
					<p class="text-md text-gray-500">${history.loserScore}</p>
				</div>
			</div>
		</div>
		`;
	}
	private renderPlayerAvatar(player: {
		username: string;
		avatar?: string;
	}): string {
		const defaultAvatar = "/avatars/default.svg";
		let avatarUrl = defaultAvatar;
		if (player.avatar?.trim()) {
			avatarUrl = player.avatar.startsWith("/avatars/")
				? player.avatar
				: `/avatars/${player.avatar}`;
		}

		return `
		<div class="flex items-center">
			<img 
				src="${avatarUrl}" 
				alt="${player.username}のアバター" 
				class="w-10 h-10 rounded-full inline-block mx-1 object-cover" 
				onerror="this.src='${defaultAvatar}'"
			>
		</div>
		`;
	}

	private profileLink(username: string): string {
		return `<a href="/users/${username}">${username}</a>`;
	}

	private setupEventListeners(): void {
		// Remove existing listener to prevent duplicates
		if (this.clickHandler) {
			document.removeEventListener("click", this.clickHandler);
		}

		this.clickHandler = async (event) => {
			const target = event.target as HTMLElement;

			if (target.id === "block-user-btn") {
				const userId = target.getAttribute("data-user-id");
				if (userId) {
					await this.handleBlockUser(userId);
				}
			}
		};

		document.addEventListener("click", this.clickHandler);
	}

	private async handleBlockUser(userId: string): Promise<void> {
		const button = document.getElementById(
			"block-user-btn",
		) as HTMLButtonElement;
		const isBlocked =
			button.textContent?.includes("ブロック済み") ||
			button.textContent?.includes("解除");

		if (isBlocked) {
			// Unblock user
			const confirmed = confirm(
				"このユーザーのブロックを解除しますか？解除すると、このユーザーからのメッセージやゲーム招待を再び受信するようになります。",
			);
			if (!confirmed) return;

			if (button) {
				button.disabled = true;
				button.textContent = "🔓 解除中...";
			}

			try {
				await this.apiClient.delete(`/api/blocks/${userId}`);

				new FloatingBanner({
					message: "ユーザーのブロックを解除しました",
					type: "success",
				}).show();

				// Reset button to original state
				if (button) {
					button.disabled = false;
					button.textContent = "🚫 ブロック";
					button.classList.remove("bg-gray-500");
					button.classList.add("bg-red-600", "hover:bg-red-700");
				}
			} catch (error) {
				console.error("Failed to unblock user:", error);
				new FloatingBanner({
					message: "ユーザーのブロック解除に失敗しました",
					type: "error",
				}).show();

				// Restore blocked state on error
				if (button) {
					button.disabled = false;
					button.textContent = "🔓 ブロック解除";
				}
			}
		} else {
			// Block user
			const confirmed = confirm(
				"このユーザーをブロックしますか？ブロックすると、このユーザーからのメッセージやゲーム招待を受信しなくなります。",
			);
			if (!confirmed) return;

			if (button) {
				button.disabled = true;
				button.textContent = "🚫 ブロック中...";
			}

			try {
				await this.apiClient.post("/api/blocks", {
					blockedId: userId,
				});

				new FloatingBanner({
					message: "ユーザーをブロックしました",
					type: "success",
				}).show();

				// Update button to show unblock option
				if (button) {
					button.disabled = false;
					button.textContent = "🔓 ブロック解除";
					button.classList.remove("bg-red-600", "hover:bg-red-700");
					button.classList.add("bg-orange-500", "hover:bg-orange-600");
				}
			} catch (error) {
				console.error("Failed to block user:", error);
				new FloatingBanner({
					message: "ユーザーのブロックに失敗しました",
					type: "error",
				}).show();

				// Re-enable button on error
				if (button) {
					button.disabled = false;
					button.textContent = "🚫 ブロック";
				}
			}
		}
	}

	// コンポーネントのクリーンアップ
	destroy(): void {
		console.log("[DEBUG] UserProfile cleanup - Removing event listeners");

		// Remove document-level event listeners
		if (this.clickHandler) {
			document.removeEventListener("click", this.clickHandler);
			this.clickHandler = null;
		}
	}
}
