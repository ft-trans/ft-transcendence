import type { AuthStatusResponse } from "../../shared/api/auth";
import { authStore } from "../store/auth_store";
import { ApiClient } from "./api_client";

export const checkAuthStatus = async (): Promise<void> => {
	const apiClient = new ApiClient();
	try {
		authStore.setLoading(true);
		const response =
			await apiClient.get<AuthStatusResponse>("/api/auth/status");
		if (response?.user) {
			authStore.setUser(response.user);

			// 認証済みユーザーをオンライン状態に設定
			try {
				await apiClient.post("/api/presence/online", {});
				console.log("[AuthAPI] User set to online on authentication check");
			} catch (error) {
				console.error("[AuthAPI] Failed to set user online:", error);
			}
		} else {
			authStore.clearUser();
		}
	} catch (_) {
		authStore.clearUser();
	}
};
