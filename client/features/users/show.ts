import type {
	GetProfileResponse,
	GetUserStatsResponse,
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

	async onLoad(params: RouteParams): Promise<void> {
		try {
			await this.renderProfile(params.username);
		} catch (_error) {
			new FloatingBanner({
				message: "ユーザーが存在しません。",
				type: "error",
			}).show();
			// TODO 404ページへ遷移
		}
		this.renderStats();
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
<div id="user-dashboard" class="mt-8">
	${new SectionTitle({ text: "勝敗" }).render()}
	<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
		<div id="user-profile-content">
			${this.loadingStats()}
		</div>
	</div>
</div>
<div id="user-history" class="mt-8">
	${new SectionTitle({ text: "対戦履歴" }).render()}
	<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
		<div id="user-profile-content">
			<div class="bg-gray-400 animate-pulse h-8 w-full mb-2"></div>
			<div class="bg-gray-400 animate-pulse h-8 w-full mb-2"></div>
			<div class="bg-gray-400 animate-pulse h-8 w-full mb-2"></div>
			<div class="bg-gray-400 animate-pulse h-8 w-full"></div>
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
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
				<div class="grid grid-cols-2 gap-4 text-center">
					<div><p>総試合数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
					<div><p>勝率</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
					<div><p>勝利数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
					<div><p>敗北数</p> <p class="font-bold bg-gray-400 animate-pulse h-8"></p></div>
				</div>
			</div>
		`;
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
		element.innerHTML = `
		${user.avatar ? `<img src="${user.avatar}" alt="Avatar" class="w-30 h-30 rounded-full mb-2">` : `<div class="w-30 h-30 rounded-full bg-gray-300 mb-2"></div>`}
		<h2 class="text-2xl font-bold mb-2">${user.username}</h2>
		${isCurrentUser ? `<p class="text-gray-600 mb-4">${state.user?.email}</p>` : ``}
		${
			isCurrentUser
				? `<a href="/profile/edit" data-link class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">プロフィール編集</a>`
				: ``
		}
		`;
	}

	private async renderStats(): Promise<void> {
		if (!this.userId) {
			return;
		}
		const stats = await this.apiClient.get<GetUserStatsResponse["stats"]>(
			`/api/users/${this.userId}/stats`,
		);
		const element = document.getElementById("user-dashboard");
		if (!element) {
			return;
		}
		element.innerHTML = `
		${new SectionTitle({ text: "勝敗" }).render()}
		<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
			<div class="grid grid-cols-2 gap-4 text-center">
				<div><p>総試合数</p> <p class="text-3xl font-bold">${stats.totalMatches}</p></div>
				<div><p>勝率</p> <p class="text-3xl font-bold">${(stats.winRate * 100).toFixed(2)}%</p></div>
				<div><p>勝利数</p> <p class="text-3xl font-bold">${stats.wins}</p></div>
				<div><p>敗北数</p> <p class="text-3xl font-bold">${stats.losses}</p></div>
			</div>
		</div>
		`;
	}

	private async renderHistory(params: RouteParams): Promise<void> {}
}
