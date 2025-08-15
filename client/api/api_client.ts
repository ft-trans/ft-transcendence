import type { AxiosInstance } from "axios";
import axios from "axios";

export class ApiClient {
	private readonly client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});
	}

	async get<Response>(path: string): Promise<Response> {
		return this.client.get<Response>(path).then((response) => response.data);
	}

	async post<Request, Response>(
		path: string,
		body: Request,
	): Promise<Response> {
		return this.client
			.post<Response>(path, body)
			.then((response) => response.data);
	}

	async put<Request, Response>(path: string, body: Request): Promise<Response> {
		return this.client
			.put<Response>(path, body)
			.then((response) => response.data);
	}

	async delete<Response>(path: string): Promise<Response> {
		return this.client.delete<Response>(path).then((response) => response.data);
	}

	async patch<Request, Response>(
		path: string,
		body: Request,
	): Promise<Response> {
		return this.client
			.patch<Response>(path, body)
			.then((response) => response.data);
	}
}
