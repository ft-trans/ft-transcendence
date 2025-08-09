import { Home } from "./features/home";
import { Router } from "./router";

export class App {
	private router: Router;

	constructor() {
		const appContainer = document.getElementById("app");
		if (!appContainer) {
			throw new Error("App container not found");
		}

		this.router = new Router({
			container: appContainer,
			routes: [
				{
					path: "/",
					component: new Home(),
				},
			],
		});
	}

	start(): void {
		this.router.start();
	}
}
