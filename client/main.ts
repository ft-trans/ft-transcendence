import { checkAuthStatus } from "./api/auth";
import { router } from "./router";

document.addEventListener("DOMContentLoaded", async () => {
	// Check authentication status on app initialization
	await checkAuthStatus();

	// Then initialize router
	router();
});
