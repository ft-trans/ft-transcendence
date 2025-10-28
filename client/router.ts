import { pathToRegexp } from "path-to-regexp";
import { type Component, createRouteParams, Navigation } from "./components";
import { Login, Register } from "./features/auth";
import { BlockedUsersPage } from "./features/blocked_users/blocked_users_page";
import { FriendsPage } from "./features/friends";
import { Home } from "./features/home";
import { Matchmaking } from "./features/matchmaking";
import { MessagesPage } from "./features/messages";
import { MatchesPong } from "./features/pong/matches";
import { EditProfile } from "./features/profile";
import {
	TournamentDetail,
	TournamentForm,
	TournamentList,
} from "./features/tournament";
import { UserProfile } from "./features/users/show";

let isRouting = false;
let currentComponent: Component | null = null;

export const router = async () => {
	// 無限ループ防止：既にルーティング中の場合は処理をスキップ
	if (isRouting) {
		console.log("[DEBUG] Router already processing, skipping");
		return;
	}

	isRouting = true;

	try {
		const container = document.querySelector<HTMLElement>("#app");
		if (!container) {
			console.error("App container not found");
			return;
		}
		const routes = [
			{
				path: "/",
				component: new Navigation({ child: new Home() }),
			},
			{
				path: "/auth/login",
				component: new Navigation({ child: new Login() }),
			},
			{
				path: "/auth/register",
				component: new Navigation({ child: new Register() }),
			},
			{
				path: "/profile/edit",
				component: new Navigation({ child: new EditProfile() }),
			},
			{
				path: "/matchmaking",
				component: new Navigation({ child: new Matchmaking() }),
			},
			{
				path: "/pong/matches/:match_id",
				component: new Navigation({ child: new MatchesPong() }),
			},
			{
				path: "/messages",
				component: new Navigation({ child: new MessagesPage() }),
			},
			{
				path: "/messages/:userId",
				component: new Navigation({ child: new MessagesPage() }),
			},
			{
				path: "/friends",
				component: new Navigation({ child: new FriendsPage() }),
			},
			{
				path: "/blocked-users",
				component: new Navigation({ child: new BlockedUsersPage() }),
			},
			{
				path: "/users/:username",
				component: new Navigation({ child: new UserProfile() }),
			},
			{
				path: "/tournaments",
				component: new Navigation({ child: new TournamentList() }),
			},
			{
				path: "/tournaments/new",
				component: new Navigation({ child: new TournamentForm() }),
			},
			{
				path: "/tournaments/:id",
				component: new Navigation({ child: new TournamentDetail() }),
			},
		];

		const path = window.location.pathname;
		for (const route of routes) {
			const { regexp, keys } = pathToRegexp(route.path);
			const match = regexp.exec(path);

			if (match) {
				// 前のコンポーネントのクリーンアップ
				if (
					currentComponent &&
					typeof currentComponent.destroy === "function"
				) {
					console.log("[DEBUG] Router: Cleaning up previous component");
					currentComponent.destroy();
				}

				// 新しいコンポーネントをセット
				currentComponent = route.component;

				container.innerHTML = route.component.render();
				if (keys.length === 0) {
					await route.component.onLoad();
					return;
				} else {
					const params = createRouteParams(keys, match);
					await route.component.onLoad(params);
					return;
				}
			}
		}

		// 404 handling
		container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p class="text-gray-600 mb-4">Page not found</p>
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 underline">トップに戻る</a>
        </div>
      </div>
    `;
	} catch (error) {
		console.error("Router error:", error);
	} finally {
		isRouting = false;
	}
};

export const navigateTo = (path: string, replace = false): void => {
	// 現在のパスと完全に同じ場合は何もしない（履歴重複を防ぐ）
	if (window.location.pathname === path && !replace) {
		console.log(
			"[DEBUG] Same path detected, ignoring navigation to prevent history duplication",
		);
		return;
	}

	// 明示的にreplaceが指定された場合、または同じパスの場合はreplace使用
	if (replace || window.location.pathname === path) {
		console.log("[DEBUG] Using replaceState for navigation");
		history.replaceState(undefined, "", path);
	} else {
		console.log("[DEBUG] Using pushState for navigation");
		history.pushState(undefined, "", path);
	}
	router();
};

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("click", (event) => {
		if (
			event.target instanceof HTMLAnchorElement &&
			event.target.matches("[data-link]")
		) {
			event.preventDefault();
			navigateTo(event.target.getAttribute("href") || "");
		}
	});
});

window.addEventListener("popstate", router);

// Debug helpers - 開発環境でのみ利用可能
if (import.meta.env.DEV) {
	(
		window as unknown as {
			debugRouter: () => void;
			testMessagesPage: () => void;
		}
	).debugRouter = () => {
		console.log("Current path:", window.location.pathname);
		console.log("Calling router manually...");
		router();
	};

	(
		window as unknown as {
			debugRouter: () => void;
			testMessagesPage: () => void;
		}
	).testMessagesPage = () => {
		console.log("Testing MessagesPage directly...");
		const messagesPage = new MessagesPage();
		console.log("MessagesPage created:", messagesPage);
		try {
			const html = messagesPage.render();
			console.log("render() succeeded, HTML length:", html.length);
			messagesPage.onLoad();
			console.log("onLoad() called");
		} catch (error) {
			console.error("Error in MessagesPage:", error);
		}
	};
}
