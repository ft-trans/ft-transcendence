import { ApiClient } from "../../api/api_client";
import { Component } from "../../components/component";
import { FloatingBanner } from "../../components/floating_banner";
import { SectionTitle } from "../../components/section_title";

interface User {
	id: string;
	email: string;
	username: string;
	avatar: string | null;
}

export class BlockedUsersPage extends Component {
	private blockedUsers: User[] = [];
	private apiClient: ApiClient;

	constructor() {
		super();
		this.apiClient = new ApiClient();
	}

	async onLoad(): Promise<void> {
		console.log("[DEBUG] BlockedUsersPage onLoad - Starting");
		await this.loadBlockedUsers();
		this.updateView();
		console.log("[DEBUG] BlockedUsersPage onLoad - Completed");
	}

	private updateView(): void {
		console.log("[DEBUG] BlockedUsersPage updateView - Starting");
		const container = document.querySelector("#app");
		if (!container) {
			console.error("[ERROR] BlockedUsersPage - #app container not found");
			return;
		}

		container.innerHTML = this.render();
		this.setupEventListeners();
		console.log("[DEBUG] BlockedUsersPage updateView - Completed");
	}

	private async loadBlockedUsers(): Promise<void> {
		try {
			console.log("[DEBUG] BlockedUsersPage - Making API call to /api/blocks");
			const response = await this.apiClient.get<User[]>("/api/blocks");
			console.log("[DEBUG] BlockedUsersPage - Raw response:", response);
			console.log("[DEBUG] BlockedUsersPage - Response type:", typeof response);
			console.log(
				"[DEBUG] BlockedUsersPage - Is Array:",
				Array.isArray(response),
			);

			if (Array.isArray(response)) {
				this.blockedUsers = response;
			} else {
				console.warn(
					"[WARN] BlockedUsersPage - Response is not an array, setting to empty array",
				);
				this.blockedUsers = [];
			}
			console.log(
				"[DEBUG] BlockedUsersPage - Loaded",
				this.blockedUsers.length,
				"blocked users",
			);
		} catch (error) {
			console.error(
				"[ERROR] BlockedUsersPage - Failed to load blocked users:",
				error,
			);
			new FloatingBanner({
				message: "ブロックしたユーザー一覧の読み込みに失敗しました",
				type: "error",
			}).show();
			// Set empty array to prevent errors
			this.blockedUsers = [];
		}
	}

	render(): string {
		console.log(
			"[DEBUG] BlockedUsersPage render - Rendering with",
			this.blockedUsers.length,
			"blocked users",
		);
		return `
			<div class="min-h-screen bg-gray-100 py-6">
				<div class="max-w-4xl mx-auto px-4">
					${new SectionTitle({ text: "ブロックしたユーザー" }).render()}
					
					<div class="bg-white rounded-lg shadow-md p-6">
						${this.blockedUsers.length === 0 ? this.renderEmptyState() : this.renderBlockedUsersList()}
					</div>
				</div>
			</div>
		`;
	}

	private renderEmptyState(): string {
		return `
			<div class="text-center py-12">
				<div class="text-gray-400 text-6xl mb-4">🚫</div>
				<h3 class="text-lg font-medium text-gray-600 mb-2">ブロックしたユーザーはいません</h3>
				<p class="text-gray-500">ブロックしたユーザーがここに表示されます。</p>
			</div>
		`;
	}

	private renderBlockedUsersList(): string {
		return `
			<div class="space-y-4">
				<p class="text-sm text-gray-600 mb-4">
					${this.blockedUsers.length}人のユーザーをブロック中
				</p>
				
				<div class="divide-y divide-gray-200">
					${this.blockedUsers.map((user) => this.renderBlockedUserItem(user)).join("")}
				</div>
			</div>
		`;
	}

	private renderBlockedUserItem(user: User): string {
		// デフォルトのアバター画像のパスを修正
		const defaultAvatar = "/avatars/default.svg";
		let avatarUrl = defaultAvatar;
		if (user.avatar?.trim()) {
			avatarUrl = user.avatar.startsWith("/avatars/")
				? user.avatar
				: `/avatars/${user.avatar}`;
		}

		return `
			<div class="py-4 flex items-center justify-between user-item" data-user-id="${user.id}">
				<div class="flex items-center space-x-4">
					<img 
						src="${avatarUrl}" 
						alt="${user.username}のアバター" 
						class="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
						onerror="this.src='${defaultAvatar}'"
					>
					<div>
						<div class="font-medium text-gray-900 username">${user.username}</div>
						<div class="text-sm text-gray-500">${user.email}</div>
					</div>
				</div>
				
				<div class="flex items-center space-x-2">
					<button 
						class="profile-link-btn px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 hover:border-blue-300"
						data-link="/users/${user.username}"
						data-user-id="${user.id}"
					>
						👤 プロフィール
					</button>
					<button 
						class="unblock-btn px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
						data-user-id="${user.id}"
					>
						🔓 ブロック解除
					</button>
				</div>
			</div>
		`;
	}

	private setupEventListeners(): void {
		const container = document.querySelector("#app");
		if (!container) return;

		// Unblock button listeners
		const unblockButtons = container.querySelectorAll(".unblock-btn");
		unblockButtons.forEach((button: Element) => {
			button.addEventListener("click", (e: Event) => this.handleUnblockUser(e));
		});

		// Profile link listeners (SPA navigation)
		const profileButtons = container.querySelectorAll(".profile-link-btn");
		profileButtons.forEach((button: Element) => {
			button.addEventListener("click", (e: Event) => {
				e.preventDefault();
				const link = (e.target as HTMLElement).getAttribute("data-link");
				if (link) {
					window.history.pushState(null, "", link);
					window.dispatchEvent(new PopStateEvent("popstate"));
				}
			});
		});
	}

	private async handleUnblockUser(event: Event): Promise<void> {
		const button = event.target as HTMLButtonElement;
		const userId = button.getAttribute("data-user-id");
		const userItem = button.closest(".user-item") as HTMLElement;
		const username = userItem?.querySelector(".username")?.textContent;

		if (!userId || !username) return;

		const confirmed = confirm(
			`${username}のブロックを解除しますか？解除すると、このユーザーからのメッセージやゲーム招待を再び受信するようになります。`,
		);
		if (!confirmed) return;

		// Disable button to prevent double clicks
		button.disabled = true;
		const originalText = button.textContent;
		button.textContent = "🔓 解除中...";

		try {
			await this.apiClient.delete(`/api/blocks/${userId}`);

			new FloatingBanner({
				message: `${username}のブロックを解除しました`,
				type: "success",
			}).show();

			// Remove the user from the list and re-render
			this.blockedUsers = this.blockedUsers.filter(
				(user) => user.id !== userId,
			);
			this.updateView();
		} catch (error) {
			console.error("Failed to unblock user:", error);
			new FloatingBanner({
				message: "ブロック解除に失敗しました",
				type: "error",
			}).show();

			// Re-enable button on error
			button.disabled = false;
			button.textContent = originalText;
		}
	}
}
