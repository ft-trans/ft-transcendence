import type { ServerMessage } from "@shared/api/chat";

export interface IChatClient {
	send(message: ServerMessage): void;
	getUserId(): string | undefined;
}
