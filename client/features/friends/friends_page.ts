import { ApiClient } from "client/api/api_client";
import { Component, FloatingBanner, SectionTitle } from "client/components";
import { AddFriendForm } from "./add_friend_form";
import { FriendList } from "./friend_list";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type FriendRequest = {
	id: string;
	requester: User;
	receiver: User;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
};

export class FriendsPage extends Component {
	private friends: User[] = [];
	private friendRequests: FriendRequest[] = [];
	private allUsers: User[] = [];

	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "友達管理" }).render()}
        
        <!-- Add Friend Section -->
        <div class="mb-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">友達を追加</h3>
          <div id="add-friend-form-container">
            ${new AddFriendForm({ users: this.allUsers }).render()}
          </div>
        </div>

        <!-- Friend Requests Section -->
        <div class="mb-8 bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">友達申請 (${this.friendRequests.length})</h3>
          ${
						this.friendRequests.length > 0
							? `
            <div class="space-y-3">
              ${this.friendRequests
								.map(
									(request) => `
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium">${request.requester.username[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">${request.requester.username}</p>
                      <p class="text-sm text-gray-500">友達申請を送信しました</p>
                    </div>
                  </div>
                  <div class="flex space-x-2">
                    <button 
                      class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      data-accept-request="${request.id}"
                    >
                      承認
                    </button>
                    <button 
                      class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      data-reject-request="${request.id}"
                    >
                      拒否
                    </button>
                  </div>
                </div>
              `,
								)
								.join("")}
            </div>
          `
							: `
            <p class="text-gray-500">友達申請はありません</p>
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
			this.loadFriendRequests(),
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

	private async loadFriendRequests(): Promise<void> {
		try {
			// Note: This endpoint doesn't exist yet - we'll need to implement it
			// For now, we'll use empty array
			this.friendRequests = [];
			// this.friendRequests = await new ApiClient().get<FriendRequest[]>("/api/friends/requests");
		} catch (error) {
			console.error("Failed to load friend requests:", error);
		}
	}

	private async loadAllUsers(): Promise<void> {
		try {
			// Note: This endpoint doesn't exist yet - we'll need to implement it
			// For now, we'll use empty array
			this.allUsers = [];
			// this.allUsers = await new ApiClient().get<User[]>("/api/users");
		} catch (error) {
			console.error("Failed to load users:", error);
		}
	}

	private setupEventListeners(): void {
		// Friend request actions
		document.addEventListener("click", async (event) => {
			const target = event.target as HTMLElement;

			// Accept friend request
			const acceptBtn = target.closest("[data-accept-request]");
			if (acceptBtn) {
				const requestId = acceptBtn.getAttribute("data-accept-request");
				if (requestId) {
					await this.respondToFriendRequest(requestId, "accept");
				}
				return;
			}

			// Reject friend request
			const rejectBtn = target.closest("[data-reject-request]");
			if (rejectBtn) {
				const requestId = rejectBtn.getAttribute("data-reject-request");
				if (requestId) {
					await this.respondToFriendRequest(requestId, "reject");
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
		});

		// Friend request sent event
		document.addEventListener("friendRequestSent", (() => {
			this.loadFriendRequests();
			new FloatingBanner({
				message: "友達申請を送信しました",
				type: "info",
			}).show();
		}) as EventListener);
	}

	private async respondToFriendRequest(
		requestId: string,
		action: "accept" | "reject",
	): Promise<void> {
		try {
			await new ApiClient().put(`/api/friends/requests/${requestId}`, {
				action,
			});

			// Reload data
			await Promise.all([this.loadFriends(), this.loadFriendRequests()]);

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

	private updateView(): void {
		// Re-render the entire component
		const container = document.querySelector("main");
		if (container) {
			container.innerHTML = this.render();
			this.setupEventListeners();
		}
	}
}
