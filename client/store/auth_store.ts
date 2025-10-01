type User = {
	id: string;
	email: string;
	username?: string;
};

type AuthState = {
	isAuthenticated: boolean;
	user?: User;
	loading: boolean;
};

class AuthStore {
	private state: AuthState = {
		isAuthenticated: false,
		loading: true,
	};

	private listeners: Set<(state: AuthState) => void> = new Set();

	subscribe(listener: (state: AuthState) => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify(): void {
		this.listeners.forEach((listener) => listener(this.state));
	}

	getState(): AuthState {
		return this.state;
	}

	setUser(user: User): void {
		this.state = {
			isAuthenticated: true,
			user,
			loading: false,
		};
		this.notify();
	}

	clearUser(): void {
		this.state = {
			isAuthenticated: false,
			loading: false,
		};
		this.notify();
	}

	setLoading(loading: boolean): void {
		this.state = {
			...this.state,
			loading,
		};
		this.notify();
	}
}

export const authStore = new AuthStore();
