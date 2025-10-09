import type { GetProfileResponse } from "@shared/api/profile";
import { ApiClient } from "client/api/api_client";
import {
	Component,
	FloatingBanner,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { authStore } from "client/store/auth_store";

export class UserProfile extends Component {
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
	}

	render(): string {
		return `
<div id="user-profile">
	${new SectionTitle({ text: "ユーザー情報" }).render()}
	<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4 ">
		<div id="user-profile-content" class="flex flex-col items-center">
			<div class="bg-gray-400 animate-pulse h-30 w-30 rounded-full mb-2"></div>
			<div class="bg-gray-400 animate-pulse h-8 w-sm mb-2"></div>
			<div class="bg-gray-400 animate-pulse h-8 w-sm mb-2"></div>
		</div>
	</div>
</div>
<div id="user-dashboard">
	${new SectionTitle({ text: "勝敗" }).render()}
	<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
		<div id="user-profile-content">
			<div class="bg-gray-400 animate-pulse h-8 w-full"></div>
		</div>
	</div>
</div>
<div id="user-history">
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

	private async renderProfile(username: string): Promise<void> {
		const state = authStore.getState();
		const url =
			username === "me" && state.isAuthenticated && state.user
				? `/api/users/${state.user.id}`
				: `/api/users/username/${username}`;
		const user = await new ApiClient().get<GetProfileResponse["user"]>(url);

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

	private async renderDashboard(params: RouteParams): Promise<void> {}

	private async renderHistory(params: RouteParams): Promise<void> {}
}
