import { ApiClient } from "client/api/api_client";
import { Component, FloatingBanner } from "client/components";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type Props = {
	users: User[];
};

export class AddFriendForm extends Component {
	private users: User[];
	private filteredUsers: User[] = [];

	constructor({ users }: Props) {
		super();
		this.users = users;
		this.filteredUsers = users;
	}

	render(): string {
		return `
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
          ${this.renderUserResults()}
        </div>
      </div>
    `;
	}

	private renderUserResults(): string {
		if (this.filteredUsers.length === 0) {
			return `
        <div class="text-center py-4">
          <p class="text-gray-500">ユーザーが見つかりません</p>
        </div>
      `;
		}

		return `
      <div class="space-y-2">
        ${this.filteredUsers
					.map(
						(user) => `
          <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-sm font-medium">${user.username[0].toUpperCase()}</span>
              </div>
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

	onLoad(): void {
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		// Search functionality
		const searchInput = document.getElementById(
			"user-search",
		) as HTMLInputElement;
		if (searchInput) {
			searchInput.addEventListener("input", (event) => {
				const query = (event.target as HTMLInputElement).value.toLowerCase();
				this.filteredUsers = this.users.filter((user) =>
					user.username.toLowerCase().includes(query),
				);
				this.updateUserResults();
			});
		}

		// Send friend request
		document.addEventListener("click", async (event) => {
			const target = event.target as HTMLElement;
			const sendBtn = target.closest("[data-send-request]");
			if (sendBtn) {
				const userId = sendBtn.getAttribute("data-send-request");
				if (userId) {
					await this.sendFriendRequest(userId);
				}
			}
		});
	}

	private async sendFriendRequest(receiverId: string): Promise<void> {
		try {
			await new ApiClient().post("/api/friends/requests", { receiverId });

			// Dispatch custom event
			document.dispatchEvent(
				new CustomEvent("friendRequestSent", {
					detail: { receiverId },
				}),
			);

			// Remove user from filtered list
			this.filteredUsers = this.filteredUsers.filter(
				(user) => user.id !== receiverId,
			);
			this.updateUserResults();
		} catch (error) {
			console.error("Failed to send friend request:", error);
			new FloatingBanner({
				message: "友達申請の送信に失敗しました",
				type: "error",
			}).show();
		}
	}

	private updateUserResults(): void {
		const container = document.getElementById("user-results");
		if (container) {
			container.innerHTML = this.renderUserResults();
		}
	}
}
