import { pathToRegexp } from "path-to-regexp";
import { Navigation } from "./components";
import { Register } from "./features/auth";
import { Home } from "./features/home";
import { EditProfile } from "./features/profile";

export const router = async () => {
	// biome-ignore lint/style/noNonNullAssertion: app container は必ず存在する
	const container = document.querySelector<HTMLElement>("#app")!;
	const routes = [
		{
			path: "/",
			component: new Navigation({ child: new Home() }),
		},
		{
			path: "/auth/register",
			component: new Navigation({ child: new Register() }),
		},
		{
			path: "/profile/edit",
			component: new Navigation({ child: new EditProfile() }),
		},
	];

	const path = window.location.pathname;
	for (const route of routes) {
		const { regexp } = pathToRegexp(route.path);
		const match = regexp.exec(path);

		if (match) {
			container.innerHTML = route.component.render();
			route.component.addEventListeners();
			return;
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
