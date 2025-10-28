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
	private clickHandler: ((event: Event) => void) | null = null;
	private messageSentHandler: (() => void) | null = null;
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
              <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <a href="/users/${this.selectedFriend.username}" data-link class="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer">${this.selectedFriend.username}</a>
                <div class="flex gap-2">
                  <a href="/users/${this.selectedFriend.username}" data-link class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                    👤 Profile
                  </a>
                  <button id="game-invite-btn" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                    🎮 Invite to Game
                  </button>
                  <button id="block-user-btn" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors">
                    🚫 Block
                  </button>
                </div>
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
		// 重複初期化を防ぐため、既存のリスナーをクリーンアップ
		this.cleanup();

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
		// Remove existing event listeners to prevent duplicates
		if (this.clickHandler) {
			document.removeEventListener("click", this.clickHandler);
		}
		if (this.messageSentHandler) {
			document.removeEventListener("messageSent", this.messageSentHandler);
		}

		// Friend selection event
		this.clickHandler = (event) => {
			const target = event.target as HTMLElement;
			const friendItem = target.closest("[data-friend-id]");
			if (friendItem) {
				const friendId = friendItem.getAttribute("data-friend-id");
				if (friendId) {
					this.selectFriend(friendId);
				}
			}

			// Handle block and game invite buttons
			if (target.id === "game-invite-btn" && this.selectedFriendId) {
				this.handleGameInvite();
			} else if (
				target.id === "block-user-btn" &&
				this.selectedFriendId &&
				this.selectedFriend
			) {
				this.handleBlockUser();
			}
		};
		document.addEventListener("click", this.clickHandler);

		// Message send event - Reload messages from server to get fresh data
		this.messageSentHandler = () => {
			// Instead of manually adding the message, reload from server to get accurate data
			if (this.selectedFriendId) {
				this.loadMessages(this.selectedFriendId).then(() => {
					this.updateMessagesContainer();
				});
			}
		};
		document.addEventListener("messageSent", this.messageSentHandler);
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

			// リスナーの重複登録を防ぐため、明示的にクリーンアップしてから再設定
			if (this.clickHandler) {
				document.removeEventListener("click", this.clickHandler);
			}
			if (this.messageSentHandler) {
				document.removeEventListener("messageSent", this.messageSentHandler);
			}
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

	private async handleGameInvite(): Promise<void> {
		if (!this.selectedFriendId || !this.selectedFriend) return;

		const btn = document.getElementById("game-invite-btn") as HTMLButtonElement;
		if (!btn) return;

		const originalText = btn.textContent;

		try {
			// Show loading state
			btn.textContent = "送信中...";
			btn.disabled = true;
			btn.classList.add("bg-gray-500");
			btn.classList.remove("bg-green-600", "hover:bg-green-700");

			// Ensure WebSocket is connected before sending
			if (!wsManager.isConnected()) {
				console.log(
					"[Messages] WebSocket not connected, attempting to reconnect...",
				);
				wsManager.connect();
				// Wait a bit for connection to establish
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			// Send game invite via WebSocket
			wsManager.sendGameInvite(this.selectedFriendId);

			// Show success feedback
			btn.textContent = "✓ Invited!";
			btn.classList.remove("bg-gray-500");
			btn.classList.add("bg-green-500");

			new FloatingBanner({
				message: `${this.selectedFriend.username}にゲーム招待を送信しました`,
				type: "success",
			}).show();

			// Reset button after 3 seconds
			setTimeout(() => {
				btn.textContent = originalText;
				btn.disabled = false;
				btn.classList.remove("bg-green-500");
				btn.classList.add("bg-green-600", "hover:bg-green-700");
			}, 3000);
		} catch (error) {
			console.error("Failed to send game invite:", error);

			// Reset button immediately on error
			btn.textContent = originalText;
			btn.disabled = false;
			btn.classList.remove("bg-gray-500");
			btn.classList.add("bg-green-600", "hover:bg-green-700");

			const errorMessage =
				error instanceof Error
					? error.message.includes("WebSocket")
						? "WebSocket接続が切断されています。ページを更新してください。"
						: "ゲーム招待の送信に失敗しました"
					: "ゲーム招待の送信に失敗しました";

			new FloatingBanner({
				message: errorMessage,
				type: "error",
			}).show();
		}
	}

	private async handleBlockUser(): Promise<void> {
		if (!this.selectedFriendId || !this.selectedFriend) return;

		const button = document.getElementById(
			"block-user-btn",
		) as HTMLButtonElement;
		const isBlocked = button.textContent?.includes("解除");
		const friendName = this.selectedFriend.username;

		if (isBlocked) {
			// Unblock user
			const confirmed = confirm(
				`${friendName}のブロックを解除しますか？解除すると、このユーザーからのメッセージやゲーム招待を再び受信するようになります。`,
			);
			if (!confirmed) return;

			if (button) {
				button.disabled = true;
				button.textContent = "🔓 解除中...";
			}

			try {
				await new ApiClient().delete(`/api/blocks/${this.selectedFriendId}`);

				new FloatingBanner({
					message: `${friendName}のブロックを解除しました`,
					type: "success",
				}).show();

				// Reset button
				if (button) {
					button.disabled = false;
					button.textContent = "🚫 Block";
					button.classList.remove("bg-orange-500", "hover:bg-orange-600");
					button.classList.add("bg-red-600", "hover:bg-red-700");
				}
			} catch (error) {
				console.error("Failed to unblock user:", error);
				new FloatingBanner({
					message: "ブロック解除に失敗しました",
					type: "error",
				}).show();

				// Restore blocked state on error
				if (button) {
					button.disabled = false;
					button.textContent = "🔓 ブロック解除";
				}
			}
		} else {
			// Block user
			const confirmed = confirm(
				`${friendName}をブロックしますか？この操作により、友達リストから削除され、今後のコミュニケーションが制限されます。`,
			);
			if (!confirmed) return;

			if (button) {
				button.disabled = true;
				button.textContent = "🚫 ブロック中...";
			}

			try {
				await new ApiClient().post("/api/blocks", {
					blockedId: this.selectedFriendId,
				});

				new FloatingBanner({
					message: `${friendName}をブロックしました`,
					type: "success",
				}).show();

				// Update button to show unblock option
				if (button) {
					button.disabled = false;
					button.textContent = "🔓 ブロック解除";
					button.classList.remove("bg-red-600", "hover:bg-red-700");
					button.classList.add("bg-orange-500", "hover:bg-orange-600");
				}
			} catch (error) {
				console.error("Failed to block user:", error);
				new FloatingBanner({
					message: "ユーザーのブロックに失敗しました",
					type: "error",
				}).show();

				// Re-enable button on error
				if (button) {
					button.disabled = false;
					button.textContent = "🚫 Block";
				}
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

		// WebSocket is already connected globally, just setup message handler for this page
		// Setup message handler for chat messages only (game invites are handled globally)
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
			// Game invite handling is now done globally in main.ts
		});

		// Cleanup on page unload (remove existing listener first to prevent duplicates)
		window.removeEventListener("beforeunload", this.cleanup);
		window.addEventListener("beforeunload", this.cleanup.bind(this));
	}

	private cleanupWebSocket(): void {
		if (this.wsUnsubscribe) {
			this.wsUnsubscribe();
			this.wsUnsubscribe = null;
		}
		// Don't disconnect WebSocket as it's managed globally
		// wsManager.disconnect();
	}

	private cleanup(): void {
		console.log("[DEBUG] MessagesPage cleanup - Removing event listeners");

		// Remove document-level event listeners
		if (this.clickHandler) {
			document.removeEventListener("click", this.clickHandler);
			this.clickHandler = null;
		}
		if (this.messageSentHandler) {
			document.removeEventListener("messageSent", this.messageSentHandler);
			this.messageSentHandler = null;
		}

		// Cleanup WebSocket subscriptions
		this.cleanupWebSocket();

		// Remove beforeunload listener (if previously added)
		window.removeEventListener("beforeunload", this.cleanup);
	}
}
