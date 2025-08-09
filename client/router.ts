import { pathToRegexp } from "path-to-regexp";
import type { Component } from "./components/component";

export type Route = {
	path: string;
	component: Component;
};

export class Router {
	private readonly container: HTMLElement;
	private routes: Route[] = [];

	constructor({
		container,
		routes,
	}: { container: HTMLElement; routes: Route[] }) {
		this.container = container;
		this.routes = routes;

		document.addEventListener("DOMContentLoaded", () => {
			document.addEventListener("click", (event) => {
				if (
					event.target instanceof HTMLAnchorElement &&
					event.target.matches("[data-link]")
				) {
					event.preventDefault();
					this.navigateTo(event.target.getAttribute("href") || "");
				}
			});
		});
	}

	start(): void {
		this.handleRoute();
	}

	navigateTo(path: string): void {
		history.pushState({}, "", path);
		this.handleRoute();
	}

	private handleRoute(): void {
		const path = window.location.pathname;

		for (const route of this.routes) {
			const { regexp } = pathToRegexp(route.path);
			const match = regexp.exec(path);

			if (match) {
				this.container.innerHTML = route.component.render(undefined);
				return;
			}
		}

		// 404 handling
		this.container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p class="text-gray-600 mb-4">Page not found</p>
          <a href="/" data-link class="text-blue-600 hover:text-blue-800 underline">トップに戻る</a>
        </div>
      </div>
    `;
	}
}
