import type { ClientMessage, ServerMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";

type MessageHandler = (message: ServerMessage) => void;

export class WebSocketManager {
	private ws: WebSocket | null = null;
	private messageHandlers: Set<MessageHandler> = new Set();
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	connect(): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			return;
		}

		// Use cookie-based authentication - cookies are automatically sent with WebSocket connections
		const wsUrl = `${import.meta.env.VITE_WS_URL || "ws://localhost:3000"}/ws/chat`;
		this.ws = new WebSocket(wsUrl);

		this.ws.onopen = () => {
			console.log("[WS] Connected to chat server");
			this.reconnectAttempts = 0;
		};

		this.ws.onmessage = (event) => {
			try {
				const message: ServerMessage = JSON.parse(event.data);
				this.messageHandlers.forEach((handler) => handler(message));
			} catch (error) {
				console.error("[WS] Failed to parse message:", error);
			}
		};

		this.ws.onclose = () => {
			console.log("[WS] Disconnected from chat server");
			this.attemptReconnect();
		};

		this.ws.onerror = (error) => {
			console.error("[WS] WebSocket error:", error);
		};
	}

	disconnect(): void {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.messageHandlers.clear();
	}

	sendMessage(receiverId: string, content: string): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.error("[WS] WebSocket not connected");
			return;
		}

		const message: ClientMessage = {
			type: MESSAGE_TYPES.SEND_MESSAGE,
			payload: {
				receiverId,
				content,
			},
		};

		this.ws.send(JSON.stringify(message));
	}

	sendGameInvite(receiverId: string): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			console.error("[WS] WebSocket not connected");
			return;
		}

		const message: ClientMessage = {
			type: MESSAGE_TYPES.SEND_GAME_INVITE,
			payload: {
				receiverId,
			},
		};

		this.ws.send(JSON.stringify(message));
	}

	onMessage(handler: MessageHandler): () => void {
		this.messageHandlers.add(handler);
		return () => this.messageHandlers.delete(handler);
	}

	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error("[WS] Max reconnection attempts reached");
			return;
		}

		this.reconnectAttempts++;
		const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

		console.log(
			`[WS] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
		);

		setTimeout(() => {
			this.connect();
		}, delay);
	}
}

// Singleton instance
export const wsManager = new WebSocketManager();
