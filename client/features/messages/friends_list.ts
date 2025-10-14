import { Component } from "client/components";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type Props = {
	friends: User[];
	selectedFriendId: string | null;
};

export class FriendsList extends Component {
	private readonly friends: User[];
	private readonly selectedFriendId: string | null;

	constructor({ friends, selectedFriendId }: Props) {
		super();
		this.friends = friends;
		this.selectedFriendId = selectedFriendId;
	}

	render(): string {
		if (this.friends.length === 0) {
			return `
        <div class="p-4 text-center text-gray-500">
          <p>友達がいません</p>
        </div>
      `;
		}

		return `
      <div class="divide-y divide-gray-200">
        ${this.friends
					.map(
						(friend) => `
          <div 
            class="p-4 hover:bg-gray-50 cursor-pointer ${
							this.selectedFriendId === friend.id ? "bg-blue-50" : ""
						}" 
            data-friend-id="${friend.id}"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                ${(() => {
									const defaultAvatar = "/avatars/default.svg";
									let avatarUrl = defaultAvatar;
									if (friend.avatar?.trim()) {
										avatarUrl = friend.avatar.startsWith("/avatars/")
											? friend.avatar
											: `/avatars/${friend.avatar}`;
									}
									return `<img src="${avatarUrl}" alt="${friend.username}のアバター" class="h-10 w-10 rounded-full object-cover" onerror="this.src='${defaultAvatar}'">`;
								})()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  ${friend.username}
                </p>
                <p class="text-sm text-gray-500">
                  ${friend.status === "online" ? "🟢 オンライン" : "⚫ オフライン"}
                </p>
              </div>
            </div>
          </div>
        `,
					)
					.join("")}
      </div>
    `;
	}
}
