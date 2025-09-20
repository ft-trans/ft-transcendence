export type SendMessage = {
	type: "sendMessage";
	payload: {
		receiverId: string;
		content: string;
	};
};

export type NewMessage = {
	type: "newMessage";
	payload: {
		senderId: string;
		senderEmail: string;
		content: string;
		timestamp: string;
	};
};

export type SendGameInvite = {
	type: "sendGameInvite";
	payload: {
		receiverId: string;
	};
};

export type GameInvite = {
	type: "gameInvite";
	payload: {
		senderId: string;
		senderEmail: string;
	};
};

export type ClientMessage = SendMessage | SendGameInvite;
export type ServerMessage = NewMessage | GameInvite;
