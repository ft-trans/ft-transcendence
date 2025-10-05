import { pathToRegexp } from "path-to-regexp";
import { createRouteParams, Navigation } from "./components";
import { Login, Register } from "./features/auth";
import { FriendsPage } from "./features/friends";
import { Home } from "./features/home";
import { Matchmaking } from "./features/matchmaking";
import { MessagesPage } from "./features/messages";
import { MatchesPong } from "./features/pong/matches";
import { EditProfile } from "./features/profile";

export const router = async () => {
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
	];

	const path = window.location.pathname;
	for (const route of routes) {
		const { regexp, keys } = pathToRegexp(route.path);
		const match = regexp.exec(path);

		if (match) {
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
};

export const navigateTo = (path: string): void => {
	history.pushState(undefined, "", path);
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
