import { ApiClient } from "client/api/api_client";
import { FloatingBanner } from "client/components";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";
import { Component, type RouteParams } from "../component";
import { Button } from "../form/button";
import { Link } from "../navigation";

type Props = {
	child: Component;
};

export class Navigation extends Component {
	private readonly child: Component;
	private isAuthenticated = false;

	constructor({ child }: Props) {
		super();
		this.child = child;
		const state = authStore.getState();
		this.isAuthenticated = state.isAuthenticated;
	}

	render(): string {
		const navContent = this.isAuthenticated
			? `
				${new Link({ href: "/profile/edit", text: "プロフィール編集" }).render()}
				${new Button({ id: "logout-btn", text: "ログアウト", color: "gray" }).render()}
			`
			: `
				${new Link({ href: "/auth/login", text: "ログイン" }).render()}
				${new Link({ href: "/auth/register", text: "新規登録" }).render()}
			`;

		return `
      <div class="min-h-screen">
        <header class="bg-white shadow-sm">
          <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <h1 class="text-2xl font-bold text-gray-900">
                  <a href="/" data-link class="hover:text-blue-600">ft_trans</a>
              </h1>
              <nav class="space-x-6 flex items-center">
                ${navContent}
              </nav>
            </div>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">${this.child.render()}</main>
      </div>
    `;
	}

	onLoad(params?: RouteParams): void {
		// Handle logout button
		const logoutBtn = document.getElementById("logout-btn");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", async () => {
				try {
					await new ApiClient().delete("/api/auth/logout");
					authStore.clearUser();
					new FloatingBanner({
						message: "ログアウトしました",
						type: "info",
					}).show();
					setTimeout(() => {
						navigateTo("/auth/login");
					}, 1000);
				} catch (error) {
					console.error("Logout failed:", error);
					authStore.clearUser();
					navigateTo("/auth/login");
				}
			});
		}

		// Subscribe to auth state changes
		authStore.subscribe((state) => {
			this.isAuthenticated = state.isAuthenticated;
		});

		this.child.onLoad(params);
	}
}
