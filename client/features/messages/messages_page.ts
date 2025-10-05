import type { ServerMessage } from "@shared/api/chat";
import { MESSAGE_TYPES } from "@shared/api/chat";
import { ApiClient } from "client/api/api_client";
import { Component, FloatingBanner, SectionTitle } from "client/components";
import { authStore } from "client/store/auth_store";
import { FriendsList } from "./friends_list";
import { MessageForm } from "./message_form";
import { MessageList } from "./message_list";
import { wsManager } from "./websocket_manager";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type DirectMessage = {
	id: string;
	sender: {
		id: string;
		username: string;
	};
	receiver: {
		id: string;
		username: string;
	};
	content: string;
	isRead: boolean;
	sentAt: string;
};

export class MessagesPage extends Component {
	private friends: User[] = [];
	private messages: DirectMessage[] = [];
	private selectedFriendId: string | null = null;
	private selectedFriend: User | null = null;
	private wsUnsubscribe: (() => void) | null = null;
	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "メッセージ" }).render()}
        <div class="flex h-96 bg-white rounded-lg shadow">
          <!-- Friends List -->
          <div class="w-1/3 border-r border-gray-200">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">友達 (${this.friends.length})</h3>
            </div>
            <div id="friends-list-container">
              ${new FriendsList({ friends: this.friends, selectedFriendId: this.selectedFriendId }).render()}
            </div>
          </div>
          
          <!-- Messages Area -->
          <div class="flex-1 flex flex-col">
            ${
							this.selectedFriend
								? `
              <div class="p-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">${this.selectedFriend.username}</h3>
              </div>
              <div class="flex-1 overflow-y-auto p-4" id="messages-container">
                ${new MessageList({ messages: this.messages }).render()}
              </div>
              <div class="border-t border-gray-200 p-4" id="message-form-container">
                ${this.selectedFriendId ? new MessageForm({ receiverId: this.selectedFriendId }).render() : ""}
              </div>
            `
								: `
              <div class="flex-1 flex items-center justify-center text-gray-500">
                <p>友達を選択してチャットを開始しましょう</p>
              </div>
            `
						}
          </div>
        </div>
      </div>
    `;
	}

	async onLoad(): Promise<void> {
		await this.loadFriends();

		// データロード後にUIを更新
		const container = document.querySelector("main");
		if (container) {
			container.innerHTML = this.render();
		}

		this.setupEventListeners();
		this.setupWebSocket();

		// Initialize MessageForm if a friend is selected
		if (this.selectedFriendId) {
			const messageForm = new MessageForm({
				receiverId: this.selectedFriendId,
			});
			messageForm.onLoad();
		}
	}
	private async loadFriends(): Promise<void> {
		try {
			this.friends = await new ApiClient().get<User[]>("/api/friends");
		} catch (error) {
			console.error("Failed to load friends:", error);
			new FloatingBanner({
				message: "友達リストの読み込みに失敗しました",
				type: "error",
			}).show();
		}
	}

	private async loadMessages(partnerId: string): Promise<void> {
		try {
			this.messages = await new ApiClient().get<DirectMessage[]>(
				`/api/dms/${partnerId}`,
			);
		} catch (error) {
			console.error("Failed to load messages:", error);
			new FloatingBanner({
				message: "メッセージの読み込みに失敗しました",
				type: "error",
			}).show();
		}
	}

	private setupEventListeners(): void {
		// Friend selection event
		document.addEventListener("click", (event) => {
			const target = event.target as HTMLElement;
			const friendItem = target.closest("[data-friend-id]");
			if (friendItem) {
				const friendId = friendItem.getAttribute("data-friend-id");
				if (friendId) {
					this.selectFriend(friendId);
				}
			}
		});

		// Message send event - Reload messages from server to get fresh data
		document.addEventListener("messageSent", (() => {
			// Instead of manually adding the message, reload from server to get accurate data
			if (this.selectedFriendId) {
				this.loadMessages(this.selectedFriendId).then(() => {
					this.updateMessagesContainer();
				});
			}
		}) as EventListener);
	}

	private async selectFriend(friendId: string): Promise<void> {
		this.selectedFriendId = friendId;
		this.selectedFriend = this.friends.find((f) => f.id === friendId) || null;
		await this.loadMessages(friendId);
		this.updateView();
	}

	private updateView(): void {
		// Re-render the entire component
		const container = document.querySelector("main");
		if (container) {
			container.innerHTML = this.render();
			this.setupEventListeners();

			// Initialize MessageForm if a friend is selected
			if (this.selectedFriendId) {
				const messageForm = new MessageForm({
					receiverId: this.selectedFriendId,
				});
				messageForm.onLoad();
			}
		}
	}

	private updateMessagesContainer(): void {
		const container = document.getElementById("messages-container");
		if (container) {
			container.innerHTML = new MessageList({
				messages: this.messages,
			}).render();
			// Scroll to bottom
			container.scrollTop = container.scrollHeight;
		}
	}

	private setupWebSocket(): void {
		const state = authStore.getState();
		if (!state.user?.id) {
			console.error("User not authenticated");
			return;
		}

		// Connect to WebSocket
		wsManager.connect();

		// Setup message handler
		this.wsUnsubscribe = wsManager.onMessage((message: ServerMessage) => {
			if (message.type === MESSAGE_TYPES.NEW_MESSAGE) {
				const { senderId, senderName, content, timestamp } = message.payload;

				// Only add message if it's from the currently selected friend (not from myself)
				if (this.selectedFriendId && senderId === this.selectedFriendId) {
					// Create DirectMessage object to match the expected format
					const newMessage: DirectMessage = {
						id: `${Date.now()}-${Math.random()}`, // Generate temporary ID
						sender: {
							id: senderId,
							username: senderName,
						},
						receiver: {
							id: state.user?.id || "",
							username: state.user?.username || "",
						},
						content,
						isRead: false,
						sentAt: timestamp,
					};

					this.messages.push(newMessage);
					this.updateMessagesContainer();
				}
			}
		});

		// Cleanup on page unload
		window.addEventListener("beforeunload", () => {
			this.cleanupWebSocket();
		});
	}

	private cleanupWebSocket(): void {
		if (this.wsUnsubscribe) {
			this.wsUnsubscribe();
			this.wsUnsubscribe = null;
		}
		wsManager.disconnect();
	}
}
