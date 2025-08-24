import { z } from "zod";

export const getDirectMessagesRequestSchema = z.object({});
export type GetDirectMessagesRequest = Record<string, never>;
export type GetDirectMessagesResponse = {
	messages: {
		id: string;
		senderId: string;
		content: string;
		sentAt: string;
	}[];
};
