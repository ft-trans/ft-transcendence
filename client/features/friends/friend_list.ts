import { Component } from "client/components";

type User = {
	id: string;
	username: string;
	avatar: string;
	status: string;
};

type Props = {
	friends: User[];
};

export class FriendList extends Component {
	private friends: User[];

	constructor({ friends }: Props) {
		super();
		this.friends = friends;
	}

	render(): string {
		if (this.friends.length === 0) {
			return `
        <div class="text-center py-8">
          <p class="text-gray-500">まだ友達がいません</p>
          <p class="text-sm text-gray-400 mt-2">上のフォームから友達を追加してみましょう</p>
        </div>
      `;
		}

		return `
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        ${this.friends
					.map(
						(friend) => `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-3 mb-3">
              <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-lg font-medium">${friend.username[0].toUpperCase()}</span>
              </div>
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">${friend.username}</h4>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
									friend.status === "online"
										? "bg-green-100 text-green-800"
										: "bg-gray-100 text-gray-800"
								}">
                  ${friend.status}
                </span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                data-navigate-to="/messages/${friend.id}"
              >
                メッセージ
              </button>
              <button 
                class="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                data-remove-friend="${friend.id}"
              >
                削除
              </button>
            </div>
          </div>
        `,
					)
					.join("")}
      </div>
    `;
	}
}
