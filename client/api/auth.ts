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
		} else {
			authStore.clearUser();
		}
	} catch (_) {
		authStore.clearUser();
	}
};
