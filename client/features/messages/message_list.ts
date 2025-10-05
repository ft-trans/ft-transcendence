import { Component } from "client/components";
import { authStore } from "client/store/auth_store";

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

type Props = {
	messages: DirectMessage[];
};

export class MessageList extends Component {
	private readonly messages: DirectMessage[];

	constructor({ messages }: Props) {
		super();
		this.messages = messages;
	}

	render(): string {
		if (this.messages.length === 0) {
			return `
        <div class="flex items-center justify-center h-full text-gray-500">
          <p>メッセージはありません</p>
        </div>
      `;
		}

		return `
      <div class="space-y-4">
        ${this.messages
					.map((message) => {
						const isOwnMessage = message.sender.id === this.getCurrentUserId();
						const messageTime = new Date(message.sentAt).toLocaleTimeString(
							"ja-JP",
							{
								hour: "2-digit",
								minute: "2-digit",
							},
						);

						return `
          <div class="flex ${isOwnMessage ? "justify-end" : "justify-start"}">
            <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
							isOwnMessage
								? "bg-blue-500 text-white"
								: "bg-gray-200 text-gray-900"
						}">
              <p class="text-sm">${this.escapeHtml(message.content)}</p>
              <p class="text-xs mt-1 ${
								isOwnMessage ? "text-blue-100" : "text-gray-500"
							}">
                ${messageTime}
              </p>
            </div>
          </div>
        `;
					})
					.join("")}
      </div>
    `;
	}

	private getCurrentUserId(): string {
		const state = authStore.getState();
		return state.user?.id || "";
	}

	private escapeHtml(text: string): string {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}
}
