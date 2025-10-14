import { ApiClient } from "client/api/api_client";
import { Component, FloatingBanner, SectionTitle } from "client/components";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";
import { FriendList } from "./friend_list";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type FriendRequest = {
	id: string;
	requesterId: string;
	receiverId: string;
	status: "pending" | "accepted" | "rejected";
};

export class FriendsPage extends Component {
	private friends: User[] = [];
	private receivedFriendRequests: FriendRequest[] = [];
	private sentFriendRequests: FriendRequest[] = [];
	private allUsers: User[] = [];
	private blockedUsers: User[] = []; // Ensure it's always initialized as an array
	private requestersMap = new Map<string, User>();
	private receiversMap = new Map<string, User>();
	private clickHandler: ((event: Event) => void) | null = null;
	private friendRequestHandler: (() => void) | null = null;

	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "友達管理" }).render()}
        
        <!-- Block Management Link -->
        <div class="mb-6 bg-gray-50 rounded-lg p-4 border-l-4 border-orange-400">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-orange-600 text-xl">🚫</span>
              <div>
                <h4 class="font-medium text-gray-900">ブロック管理</h4>
                <p class="text-sm text-gray-600">ブロックしたユーザーを確認・管理</p>
              </div>
            </div>
            <button 
              class="blocked-users-link px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
              data-link="/blocked-users"
            >
              ブロック一覧を見る
            </button>
          </div>
        </div>
        
        <!-- Add Friend Section -->
        <div class="mb-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">友達を追加</h3>
          <div id="add-friend-form-container">
            <div>
              <div class="mb-4">
                <input 
                  type="text" 
                  id="user-search" 
                  placeholder="ユーザー名で検索..." 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div id="user-results" class="max-h-64 overflow-y-auto">
                ${this.renderUserResults(this.allUsers)}
              </div>
            </div>
          </div>
        </div>

        <!-- Received Friend Requests Section -->
        <div class="mb-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">受け取った友達申請 (${this.receivedFriendRequests.length})</h3>
          ${
						this.receivedFriendRequests.length > 0
							? `
            <div class="space-y-3">
              ${this.receivedFriendRequests
								.map((request) => {
									const requester = this.requestersMap.get(request.requesterId);
									const username = requester?.username || "Unknown";
									return `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div class="flex items-center space-x-3">
                    ${(() => {
										const defaultAvatar = "/avatars/default.svg";
										let avatarUrl = defaultAvatar;
										if (requester?.avatar && requester.avatar.trim()) {
											avatarUrl = requester.avatar.startsWith('/avatars/') ? requester.avatar : `/avatars/${requester.avatar}`;
										}
											return `<img src="${avatarUrl}" alt="${username}のアバター" class="w-10 h-10 rounded-full object-cover" onerror="this.src='${defaultAvatar}'">`;
										})()}
                    <div>
                      <p class="font-medium text-gray-900">${username}</p>
                      <p class="text-sm text-gray-500">友達申請を送信しました</p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      data-accept-request="${request.requesterId}"
                    >
                      承認
                    </button>
                    <button 
                      class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      data-reject-request="${request.requesterId}"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              `;
								})
								.join("")}
            </div>
          `
							: `
            <p class="text-gray-500">受け取った友達申請はありません</p>
          `
					}
        </div>

        <!-- Sent Friend Requests Section -->
        <div class="mb-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">送信した友達申請 (${this.sentFriendRequests.length})</h3>
          ${
						this.sentFriendRequests.length > 0
							? `
            <div class="space-y-3">
              ${this.sentFriendRequests
								.map((request) => {
									const receiver = this.receiversMap.get(request.receiverId);
									const username = receiver?.username || "Unknown";
									return `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div class="flex items-center space-x-3">
                    ${
										(() => {
								const defaultAvatar = "/avatars/default.svg";
								let avatarUrl = defaultAvatar;
								if (receiver?.avatar && receiver.avatar.trim()) {
									avatarUrl = receiver.avatar.startsWith('/avatars/') ? receiver.avatar : `/avatars/${receiver.avatar}`;
								}
											return `<img src="${avatarUrl}" alt="${username}のアバター" class="w-10 h-10 rounded-full object-cover" onerror="this.src='${defaultAvatar}'">`;
										})()
										}
                    <div>
                      <p class="font-medium text-gray-900">${username}</p>
                      <p class="text-sm text-gray-500">友達申請を送信中</p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      data-cancel-request="${request.receiverId}"
                    >
                      取り消し
                    </button>
                  </div>
                </div>
              `;
								})
								.join("")}
            </div>
          `
							: `
            <p class="text-gray-500">送信した友達申請はありません</p>
          `
					}
        </div>

        <!-- Friends List Section -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">友達リスト (${this.friends.length})</h3>
          <div id="friend-list-container">
            ${new FriendList({ friends: this.friends }).render()}
          </div>
        </div>
      </div>
    `;
	}

	async onLoad(): Promise<void> {
		console.log("[DEBUG] FriendsPage onLoad - Starting data load");
		
		// Check authentication state
		const authState = authStore.getState();
		console.log("[DEBUG] Auth state:", authState.isAuthenticated, "User:", authState.user?.username);
		
		if (!authState.isAuthenticated) {
			console.error("[ERROR] User not authenticated");
			new FloatingBanner({
				message: "認証が必要です。ログインしてください。",
				type: "error",
			}).show();
			return;
		}
		
		try {
			// First load friend-related data that loadAllUsers depends on
			await this.loadFriends();
			await this.loadSentFriendRequests();
			await this.loadReceivedFriendRequests();
			await this.loadBlockedUsers();
			await this.loadAllUsers();

			this.initializeChildComponents();
			
			// Update UI after all data is loaded
			this.updateView();
			
			console.log("[DEBUG] FriendsPage onLoad - Completed successfully");
		} catch (error) {
			console.error("[ERROR] FriendsPage onLoad - Critical error:", error);
			new FloatingBanner({
				message: "友達ページの初期化に失敗しました",
				type: "error",
			}).show();
		}
	}

	private async loadFriends(): Promise<void> {
		try {
			console.log("[DEBUG] loadFriends - Making API call to /api/friends");
			const response = await new ApiClient().get<User[]>("/api/friends");
			console.log("[DEBUG] loadFriends - Raw response:", response);
			this.friends = response;
			console.log("[DEBUG] loadFriends - Success, loaded", this.friends.length, "friends");
		} catch (error) {
			console.error("[ERROR] Failed to load friends from /api/friends:", error);
			console.error("[ERROR] Error type:", typeof error);
			console.error("[ERROR] Error message:", error instanceof Error ? error.message : String(error));
			// Set empty array to prevent errors
			this.friends = [];
		}
	}	private async loadReceivedFriendRequests(): Promise<void> {
		try {
			this.receivedFriendRequests = await new ApiClient().get<FriendRequest[]>(
				"/api/friends/requests/received",
			);

			// 友達申請の送信者情報を取得
			for (const request of this.receivedFriendRequests) {
				if (!request.requesterId) {
					console.error("requesterId is undefined for request:", request);
					new FloatingBanner({
						message: "友達申請の送信者情報の取得に失敗しました",
						type: "error",
					}).show();
					continue;
				}

				try {
					const requester = await new ApiClient().get<User>(
						`/api/users/${request.requesterId}`,
					);
					this.requestersMap.set(request.requesterId, requester);
				} catch (error) {
					console.error(
						`Failed to load requester info for ${request.requesterId}:`,
						error,
					);
				}
			}
		} catch (error) {
			console.error("Failed to load received friend requests:", error);
		}
	}

	private async loadSentFriendRequests(): Promise<void> {
		try {
			this.sentFriendRequests = await new ApiClient().get<FriendRequest[]>(
				"/api/friends/requests/sent",
			);

			// 友達申請の受信者情報を取得
			for (const request of this.sentFriendRequests) {
				if (!request.receiverId) {
					console.error("receiverId is undefined for request:", request);
					continue;
				}

				try {
					const receiver = await new ApiClient().get<User>(
						`/api/users/${request.receiverId}`,
					);
					this.receiversMap.set(request.receiverId, receiver);
				} catch (error) {
					console.error(
						`Failed to load receiver info for ${request.receiverId}:`,
						error,
					);
				}
			}
		} catch (error) {
			console.error("Failed to load sent friend requests:", error);
		}
	}

	private async loadBlockedUsers(): Promise<void> {
		try {
			console.log("[DEBUG] loadBlockedUsers - Making API call to /api/blocks");
			const response = await new ApiClient().get<User[]>("/api/blocks");
			console.log("[DEBUG] loadBlockedUsers - Raw response:", response);
			console.log("[DEBUG] loadBlockedUsers - Response type:", typeof response);
			console.log("[DEBUG] loadBlockedUsers - Is Array:", Array.isArray(response));
			
			// Ensure response is an array
			if (Array.isArray(response)) {
				this.blockedUsers = response;
			} else {
				console.warn("[WARN] loadBlockedUsers - Response is not an array, setting to empty array");
				this.blockedUsers = [];
			}
			console.log("[DEBUG] loadBlockedUsers - Success, loaded", this.blockedUsers.length, "blocked users");
		} catch (error) {
			console.error("[ERROR] Failed to load blocked users from /api/blocks:", error);
			// Set empty array to prevent filtering errors and continue without blocking
			this.blockedUsers = [];
			console.log("[INFO] Continuing without blocked users filtering");
			// Don't show error banner for blocked users as it's not critical
		}
	}

	private async loadAllUsers(): Promise<void> {
		try {
			console.log("[DEBUG] loadAllUsers - Starting API call to /api/users");
			const response = await new ApiClient().get<User[]>("/api/users");
			console.log("[DEBUG] loadAllUsers - Raw response:", response);
			
			// Ensure response is an array
			if (!Array.isArray(response)) {
				console.error("[ERROR] loadAllUsers - Response is not an array:", typeof response);
				throw new Error("Invalid response format: expected array");
			}
			
			const allUsers = response;
			const currentUserId = authStore.getState().user?.id;
			
			console.log("[DEBUG] loadAllUsers - Total users:", allUsers.length);
			console.log("[DEBUG] loadAllUsers - Current user ID:", currentUserId);
			console.log("[DEBUG] loadAllUsers - Current friends:", this.friends.length);
			console.log("[DEBUG] loadAllUsers - Sent requests:", this.sentFriendRequests.length);
			console.log("[DEBUG] loadAllUsers - Received requests:", this.receivedFriendRequests.length);
			console.log("[DEBUG] loadAllUsers - Blocked users:", this.blockedUsers.length);
			
			// Filter out current user, existing friends, and users with pending requests
			this.allUsers = allUsers.filter(user => {
				console.log(`[DEBUG] Checking user ${user.username} (${user.id})`);
				
				// Don't show current user
				if (user.id === currentUserId) {
					console.log(`[DEBUG] Filtering out current user: ${user.username}`);
					return false;
				}
				
			// Don't show existing friends
			if (Array.isArray(this.friends) && this.friends.some(friend => friend.id === user.id)) {
				console.log(`[DEBUG] Filtering out existing friend: ${user.username}`);
				return false;
			}
			
			// Don't show users with pending friend requests (sent or received)
			const hasPendingRequest = (Array.isArray(this.sentFriendRequests) && this.sentFriendRequests.some(req => 
				req.receiverId === user.id && req.status === "pending"
			)) || (Array.isArray(this.receivedFriendRequests) && this.receivedFriendRequests.some(req => 
				req.requesterId === user.id && req.status === "pending"
			));
			
			if (hasPendingRequest) {
				console.log(`[DEBUG] Filtering out user with pending request: ${user.username}`);
				return false;
			}
			
			// Don't show blocked users
			if (Array.isArray(this.blockedUsers) && this.blockedUsers.some(blockedUser => blockedUser.id === user.id)) {
				console.log(`[DEBUG] Filtering out blocked user: ${user.username}`);
				return false;
			}
			
			console.log(`[DEBUG] User ${user.username} will be shown in search`);
			return true;
			});
			
			console.log("[DEBUG] loadAllUsers - Success, filtered to", this.allUsers.length, "available users");
			console.log("[DEBUG] Available users:", this.allUsers.map(u => u.username));
		} catch (error) {
			console.error("[ERROR] Failed to load all users from /api/users:", error);
			console.error("[ERROR] Error type:", typeof error);
			console.error("[ERROR] Error message:", error instanceof Error ? error.message : String(error));
			if (error && typeof error === 'object' && 'response' in error) {
				console.error("[ERROR] HTTP Response:", error.response);
			}
			new FloatingBanner({
				message: "ユーザー検索機能の読み込みに失敗しました",
				type: "error",
			}).show();
			// Set empty array to prevent errors
			this.allUsers = [];
		}
	}

	private initializeChildComponents(): void {
		// Initialize search functionality
		const searchInput = document.getElementById(
			"user-search",
		) as HTMLInputElement;
		if (searchInput) {
			searchInput.addEventListener("input", (event) => {
				const query = (event.target as HTMLInputElement).value.toLowerCase();
				const filteredUsers = this.allUsers.filter((user) =>
					user.username.toLowerCase().includes(query),
				);
				this.updateUserResults(filteredUsers);
			});
			
			// Show initial results (all available users)
			this.updateUserResults(this.allUsers);
		} else {
			console.error("[ERROR] user-search input element not found");
		}
	}

	private updateUserResults(filteredUsers: User[]): void {
		console.log("[DEBUG] updateUserResults - Updating with", filteredUsers.length, "users");
		const container = document.getElementById("user-results");
		if (container) {
			container.innerHTML = this.renderUserResults(filteredUsers);
			console.log("[DEBUG] updateUserResults - UI updated successfully");
		} else {
			console.error("[ERROR] user-results container not found");
		}
	}

	private renderUserResults(users: User[]): string {
		if (users.length === 0) {
			// If we have sent requests to everyone, show specific message
			if (this.sentFriendRequests.length > 0 && this.allUsers.length === 0) {
				return `
					<div class="text-center py-8">
						<p class="text-gray-600 mb-2">新しいユーザーが見つかりません</p>
						<p class="text-gray-500 text-sm">全てのユーザーに友達申請を送信済みか、既に友達です</p>
					</div>
				`;
			}
			return `
        <div class="text-center py-4">
          <p class="text-gray-500">検索条件に一致するユーザーが見つかりません</p>
        </div>
      `;
		}

		return `
      <div class="space-y-2">
        ${users
					.map(
						(user) => `
          <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div class="flex items-center space-x-3">
              ${(() => {
						const defaultAvatar = "/avatars/default.svg";
						let avatarUrl = defaultAvatar;
						if (user.avatar && user.avatar.trim()) {
							avatarUrl = user.avatar.startsWith('/avatars/') ? user.avatar : `/avatars/${user.avatar}`;
						}
								return `<img src="${avatarUrl}" alt="${user.username}のアバター" class="w-10 h-10 rounded-full object-cover" onerror="this.src='${defaultAvatar}'">`;
							})()}
              <div>
                <p class="font-medium text-gray-900">${user.username}</p>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
									user.status === "online"
										? "bg-green-100 text-green-800"
										: "bg-gray-100 text-gray-800"
								}">
                  ${user.status}
                </span>
              </div>
            </div>
            <button 
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              data-send-request="${user.id}"
            >
              友達申請
            </button>
          </div>
        `,
					)
					.join("")}
      </div>
    `;
	}

	private setupEventListeners(): void {
		// Remove existing event listeners to prevent duplicates
		if (this.clickHandler) {
			document.removeEventListener("click", this.clickHandler);
		}
		if (this.friendRequestHandler) {
			document.removeEventListener("friendRequestSent", this.friendRequestHandler);
		}

		// Friend request actions
		this.clickHandler = async (event) => {
			const target = event.target as HTMLElement;

			// Accept friend request
			const acceptBtn = target.closest("[data-accept-request]") as HTMLButtonElement;
			if (acceptBtn) {
				// Additional protection: check if button is already disabled
				if (acceptBtn.disabled) {
					return;
				}
				
				const requesterId = acceptBtn.getAttribute("data-accept-request");
				if (requesterId) {
					await this.respondToFriendRequest(requesterId, "accept");
				}
				return;
			}

			// Reject friend request
			const rejectBtn = target.closest("[data-reject-request]") as HTMLButtonElement;
			if (rejectBtn) {
				// Additional protection: check if button is already disabled
				if (rejectBtn.disabled) {
					return;
				}
				
				const requesterId = rejectBtn.getAttribute("data-reject-request");
				if (requesterId) {
					await this.respondToFriendRequest(requesterId, "reject");
				}
				return;
			}

			// Block friend
			const blockBtn = target.closest("[data-block-friend]") as HTMLButtonElement;
			if (blockBtn) {
				// Additional protection: check if button is already disabled
				if (blockBtn.disabled) {
					return;
				}
				
				const friendId = blockBtn.getAttribute("data-block-friend");
				if (friendId) {
					await this.blockFriend(friendId);
				}
				return;
			}

			// Remove friend
			const removeBtn = target.closest("[data-remove-friend]");
			if (removeBtn) {
				const friendId = removeBtn.getAttribute("data-remove-friend");
				if (friendId) {
					await this.removeFriend(friendId);
				}
				return;
			}

			// Navigate to blocked users page
			const blockedUsersBtn = target.closest(".blocked-users-link") as HTMLButtonElement;
			if (blockedUsersBtn) {
				console.log("[DEBUG] Blocked users button clicked");
				const link = blockedUsersBtn.getAttribute("data-link");
				console.log("[DEBUG] Navigating to:", link);
				if (link) {
					navigateTo(link);
				} else {
					console.error("[ERROR] No data-link attribute found");
				}
				return;
			}

			// Navigate to messages
			const navigateBtn = target.closest("[data-navigate-to]");
			if (navigateBtn) {
				const path = navigateBtn.getAttribute("data-navigate-to");
				if (path) {
					navigateTo(path);
				}
				return;
			}

			// Send friend request
			const sendBtn = target.closest("[data-send-request]") as HTMLButtonElement;
			if (sendBtn) {
				// Additional protection: check if button is already disabled
				if (sendBtn.disabled) {
					return;
				}
				
				const userId = sendBtn.getAttribute("data-send-request");
				if (userId) {
					await this.sendFriendRequest(userId);
				}
				return;
			}

			// Cancel sent friend request
			const cancelBtn = target.closest("[data-cancel-request]") as HTMLButtonElement;
			if (cancelBtn) {
				// Additional protection: check if button is already disabled
				if (cancelBtn.disabled) {
					return;
				}
				
				const receiverId = cancelBtn.getAttribute("data-cancel-request");
				if (receiverId) {
					await this.cancelFriendRequest(receiverId);
				}
				return;
			}
		};
		document.addEventListener("click", this.clickHandler);

		// Friend request sent event
		this.friendRequestHandler = () => {
			this.loadReceivedFriendRequests();
			this.loadSentFriendRequests();
			new FloatingBanner({
				message: "友達申請を送信しました",
				type: "info",
			}).show();
		};
		document.addEventListener("friendRequestSent", this.friendRequestHandler);
	}

	private async respondToFriendRequest(
		requesterId: string,
		action: "accept" | "reject",
	): Promise<void> {
		// Disable buttons to prevent double clicks
		const acceptBtn = document.querySelector(`[data-accept-request="${requesterId}"]`) as HTMLButtonElement;
		const rejectBtn = document.querySelector(`[data-reject-request="${requesterId}"]`) as HTMLButtonElement;
		if (acceptBtn) {
			acceptBtn.disabled = true;
			acceptBtn.textContent = "処理中...";
		}
		if (rejectBtn) {
			rejectBtn.disabled = true;
			rejectBtn.textContent = "処理中...";
		}

		try {
			await new ApiClient().put(`/api/friends/requests/${requesterId}`, {
				action,
			});

			// Reload data
			await Promise.all([
				this.loadFriends(),
				this.loadReceivedFriendRequests(),
				this.loadSentFriendRequests(),
			]);
			
			// Reload all users to update search results
			await this.loadAllUsers();

			this.updateView();

			new FloatingBanner({
				message:
					action === "accept"
						? "友達申請を承認しました"
						: "友達申請を拒否しました",
				type: "info",
			}).show();
		} catch (error) {
			console.error("Failed to respond to friend request:", error);
			new FloatingBanner({
				message: "友達申請への応答に失敗しました",
				type: "error",
			}).show();
		} finally {
			// Re-enable buttons
			if (acceptBtn) {
				acceptBtn.disabled = false;
				acceptBtn.textContent = "承認";
			}
			if (rejectBtn) {
				rejectBtn.disabled = false;
				rejectBtn.textContent = "拒否";
			}
		}
	}

	private async blockFriend(friendId: string): Promise<void> {
		const friend = this.friends.find(f => f.id === friendId);
		const friendName = friend?.username || "このユーザー";
		
		const confirmed = confirm(`${friendName}をブロックしますか？ブロックすると、このユーザーからのメッセージやゲーム招待を受信しなくなり、友達リストからも削除されます。`);
		if (!confirmed) return;

		// Disable button to prevent double clicks
		const button = document.querySelector(`[data-block-friend="${friendId}"]`) as HTMLButtonElement;
		if (button) {
			button.disabled = true;
			button.textContent = "🚫 ブロック中...";
		}

		try {
			await new ApiClient().post("/api/blocks", {
				blockedId: friendId
			});

			// Reload friends list and blocked users list
			await this.loadFriends();
			await this.loadBlockedUsers();
			await this.loadAllUsers(); // Re-filter users to exclude newly blocked user
			this.updateView();

			new FloatingBanner({
				message: `${friendName}をブロックしました`,
				type: "success",
			}).show();
		} catch (error) {
			console.error("Failed to block friend:", error);
			new FloatingBanner({
				message: "ユーザーのブロックに失敗しました",
				type: "error",
			}).show();

			// Re-enable button on error
			if (button) {
				button.disabled = false;
				button.textContent = "🚫 ブロック";
			}
		}
	}



	private async removeFriend(friendId: string): Promise<void> {
		if (!confirm("このユーザーを友達から削除しますか？")) {
			return;
		}

		try {
			await new ApiClient().delete(`/api/friends/${friendId}`);

			// Reload friends list
			await this.loadFriends();
			this.updateView();

			new FloatingBanner({
				message: "友達を削除しました",
				type: "info",
			}).show();
		} catch (error) {
			console.error("Failed to remove friend:", error);
			new FloatingBanner({
				message: "友達の削除に失敗しました",
				type: "error",
			}).show();
		}
	}

	private async sendFriendRequest(receiverId: string): Promise<void> {
		// Disable the button to prevent double clicks
		const button = document.querySelector(`[data-send-request="${receiverId}"]`) as HTMLButtonElement;
		if (button) {
			button.disabled = true;
			button.textContent = "送信中...";
		}

		try {
			await new ApiClient().post("/api/friends/requests", { receiverId });
			
			console.log("[DEBUG] Friend request sent successfully to:", receiverId);

			// Reload sent friend requests first to update the state
			await this.loadSentFriendRequests();
			
			// Re-filter all users to remove the user we just sent a request to
			await this.loadAllUsers();
			
			// Update the UI completely
			this.updateView();

			new FloatingBanner({
				message: "友達申請を送信しました",
				type: "info",
			}).show();
		} catch (error) {
			console.error("Failed to send friend request:", error);
			
			// Don't modify UI state on error, just show error message and re-enable button
			new FloatingBanner({
				message: "友達申請の送信に失敗しました",
				type: "error",
			}).show();
			
			// Re-enable the button on error
			if (button) {
				button.disabled = false;
				button.textContent = "友達申請";
			}
		}
	}

	private async cancelFriendRequest(receiverId: string): Promise<void> {
		if (!confirm("友達申請を取り消しますか？")) {
			return;
		}

		// Disable button to prevent double clicks
		const button = document.querySelector(`[data-cancel-request="${receiverId}"]`) as HTMLButtonElement;
		if (button) {
			button.disabled = true;
			button.textContent = "取り消し中...";
		}

		try {
			// 友達申請を削除するためのAPI呼び出し
			await new ApiClient().delete(`/api/friends/requests/${receiverId}`);

			// 送信済み友達申請を再読み込み
			await this.loadSentFriendRequests();
			
			// 全ユーザーリストを再読み込みして、キャンセルしたユーザーが検索結果に再表示されるようにする
			await this.loadAllUsers();
			
			this.updateView();

			new FloatingBanner({
				message: "友達申請を取り消しました",
				type: "info",
			}).show();
		} catch (error) {
			console.error("Failed to cancel friend request:", error);
			new FloatingBanner({
				message: "友達申請の取り消しに失敗しました",
				type: "error",
			}).show();
		} finally {
			// Re-enable button
			if (button) {
				button.disabled = false;
				button.textContent = "取り消し";
			}
		}
	}

	private updateView(): void {
		// Re-render the entire component
		const container = document.querySelector("main");
		if (container) {
			container.innerHTML = this.render();
			this.setupEventListeners();
			this.initializeChildComponents();
		}
	}
}
