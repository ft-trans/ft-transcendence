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
		this.renderHistories();
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
				${this.historyAvatar(history)}
				<div class="text-4xl">
					vs
				</div>
				${this.historyAvatar(history)}
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
	private historyAvatar(history: MatchHistoryResponse): string {
		return `
		<div class="flex items-center">
			${
				history.winner.avatar
					? `
				<img src="${history.winner.avatar}" alt="Avatar" class="w-10 h-10 rounded-full inline-block mx-1">`
					: `<div class="w-10 h-10 rounded-full bg-gray-300 inline-block mx-1"></div>`
			}
		</div>
		`;
	}

	private profileLink(username: string): string {
		return `<a href="/users/${username}">${username}</a>`;
	}
}
