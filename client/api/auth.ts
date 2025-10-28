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
			// オンライン状態は認証済みAPIリクエストにより自動的に設定されます
		} else {
			authStore.clearUser();
		}
	} catch (_) {
		authStore.clearUser();
	}
};
