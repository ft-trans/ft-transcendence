import { ApiClient } from "client/api/api_client";
import { Component, FloatingBanner, SectionTitle } from "client/components";
import { navigateTo } from "client/router";
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
	private requestersMap = new Map<string, User>();
	private receiversMap = new Map<string, User>();

	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "友達管理" }).render()}
        
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
                    ${
											requester?.avatar
												? `<img src="${requester.avatar}" alt="${username}" class="w-10 h-10 rounded-full object-cover">`
												: `<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                           <span class="text-sm font-medium">${username[0].toUpperCase()}</span>
                         </div>`
										}
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
											receiver?.avatar
												? `<img src="${receiver.avatar}" alt="${username}" class="w-10 h-10 rounded-full object-cover">`
												: `<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                           <span class="text-sm font-medium">${username[0].toUpperCase()}</span>
                         </div>`
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
		await Promise.all([
			this.loadFriends(),
			this.loadReceivedFriendRequests(),
			this.loadSentFriendRequests(),
			this.loadAllUsers(),
		]);

		// データロード後にUIを更新
		const container = document.querySelector("main");
		if (container) {
			container.innerHTML = this.render();
			console.log(
				"[DEBUG] FriendsPage - UI updated with",
				this.friends.length,
				"friends",
			);
		}

		this.setupEventListeners();
		this.initializeChildComponents();
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

	private async loadReceivedFriendRequests(): Promise<void> {
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

	private async loadAllUsers(): Promise<void> {
		try {
			this.allUsers = await new ApiClient().get<User[]>("/api/users");
		} catch (error) {
			console.error("Failed to load users:", error);
			new FloatingBanner({
				message: "ユーザー情報の読み込みに失敗しました",
				type: "error",
			}).show();
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
		}
	}

	private updateUserResults(filteredUsers: User[]): void {
		const container = document.getElementById("user-results");
		if (container) {
			container.innerHTML = this.renderUserResults(filteredUsers);
		}
	}

	private renderUserResults(users: User[]): string {
		if (users.length === 0) {
			return `
        <div class="text-center py-4">
          <p class="text-gray-500">ユーザーが見つかりません</p>
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
              ${
								user.avatar
									? `<img src="${user.avatar}" alt="${user.username}" class="w-10 h-10 rounded-full object-cover">`
									: `<div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                     <span class="text-sm font-medium">${user.username[0].toUpperCase()}</span>
                   </div>`
							}
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
		// Friend request actions
		document.addEventListener("click", async (event) => {
			const target = event.target as HTMLElement;

			// Accept friend request
			const acceptBtn = target.closest("[data-accept-request]");
			if (acceptBtn) {
				const requesterId = acceptBtn.getAttribute("data-accept-request");
				if (requesterId) {
					await this.respondToFriendRequest(requesterId, "accept");
				}
				return;
			}

			// Reject friend request
			const rejectBtn = target.closest("[data-reject-request]");
			if (rejectBtn) {
				const requesterId = rejectBtn.getAttribute("data-reject-request");
				if (requesterId) {
					await this.respondToFriendRequest(requesterId, "reject");
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
			const sendBtn = target.closest("[data-send-request]");
			if (sendBtn) {
				const userId = sendBtn.getAttribute("data-send-request");
				if (userId) {
					await this.sendFriendRequest(userId);
				}
				return;
			}

			// Cancel sent friend request
			const cancelBtn = target.closest("[data-cancel-request]");
			if (cancelBtn) {
				const receiverId = cancelBtn.getAttribute("data-cancel-request");
				if (receiverId) {
					await this.cancelFriendRequest(receiverId);
				}
				return;
			}
		});

		// Friend request sent event
		document.addEventListener("friendRequestSent", (() => {
			this.loadReceivedFriendRequests();
			this.loadSentFriendRequests();
			new FloatingBanner({
				message: "友達申請を送信しました",
				type: "info",
			}).show();
		}) as EventListener);
	}

	private async respondToFriendRequest(
		requesterId: string,
		action: "accept" | "reject",
	): Promise<void> {
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
				message: "友達申請の処理に失敗しました",
				type: "error",
			}).show();
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
		try {
			await new ApiClient().post("/api/friends/requests", { receiverId });

			// Remove user from allUsers list
			this.allUsers = this.allUsers.filter((user) => user.id !== receiverId);

			// Reload friend requests
			await this.loadSentFriendRequests();
			this.updateView();

			new FloatingBanner({
				message: "友達申請を送信しました",
				type: "info",
			}).show();
		} catch (error) {
			console.error("Failed to send friend request:", error);
			new FloatingBanner({
				message: "友達申請の送信に失敗しました",
				type: "error",
			}).show();
		}
	}

	private async cancelFriendRequest(receiverId: string): Promise<void> {
		if (!confirm("友達申請を取り消しますか？")) {
			return;
		}

		try {
			// 友達申請を削除するためのAPI呼び出し
			await new ApiClient().delete(`/api/friends/requests/${receiverId}`);

			// ユーザーをallUsersリストに戻す
			try {
				const user = await new ApiClient().get<User>(
					`/api/users/${receiverId}`,
				);
				this.allUsers.push(user);
			} catch (error) {
				console.error("Failed to reload user info:", error);
			}

			// 送信済み友達申請を再読み込み
			await this.loadSentFriendRequests();
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
