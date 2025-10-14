import { MESSAGE_TYPES } from "../shared/api/chat";
import { checkAuthStatus } from "./api/auth";
import { GameInviteNotification } from "./components/game_invite_notification";
import { wsManager } from "./features/messages/websocket_manager";
import { router } from "./router";
import { authStore } from "./store/auth_store";

document.addEventListener("DOMContentLoaded", async () => {
	// Check authentication status on app initialization
	await checkAuthStatus();

	// Initialize global WebSocket connection for authenticated users
	initializeWebSocket();

	// Then initialize router
	router();
});

function initializeWebSocket(): void {
	const state = authStore.getState();

	if (state.user?.id) {
		console.log("[Main] Initializing WebSocket for user:", state.user.id);
		
		// Connect to WebSocket for global notifications
		wsManager.connect();

		// Set up global game invite handler
		wsManager.onMessage((message) => {
			if (message.type === MESSAGE_TYPES.GAME_INVITE) {
				const { senderId, senderName } = message.payload;
				
				console.log("[Main] Received game invite from:", senderName);

				// Show game invite notification
				const gameInviteNotification = new GameInviteNotification();
				gameInviteNotification.show({
					senderId,
					senderName,
				});
			}
		});
	} else {
		console.log("[Main] User not authenticated, skipping WebSocket initialization");
	}
}
