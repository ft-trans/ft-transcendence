// Message type constants to prevent typos
export const MESSAGE_TYPES = {
	SEND_MESSAGE: "sendMessage",
	NEW_MESSAGE: "newMessage",
	SEND_GAME_INVITE: "sendGameInvite",
	GAME_INVITE: "gameInvite",
} as const;

export type SendMessage = {
	type: typeof MESSAGE_TYPES.SEND_MESSAGE;
	payload: {
		receiverId: string;
		content: string;
	};
};

export type NewMessage = {
	type: typeof MESSAGE_TYPES.NEW_MESSAGE;
	payload: {
		senderId: string;
		senderEmail: string;
		content: string;
		timestamp: string;
	};
};

export type SendGameInvite = {
	type: typeof MESSAGE_TYPES.SEND_GAME_INVITE;
	payload: {
		receiverId: string;
	};
};

export type GameInvite = {
	type: typeof MESSAGE_TYPES.GAME_INVITE;
	payload: {
		senderId: string;
	};
};

export type ClientMessage = SendMessage | SendGameInvite;
export type ServerMessage = NewMessage | GameInvite;
