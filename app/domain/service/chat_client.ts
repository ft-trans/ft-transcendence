import type { ServerMessage } from "@shared/api/chat";

export interface ChatClient {
	send(message: ServerMessage): void;
	getUserId(): string | undefined;
}
