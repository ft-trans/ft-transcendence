import { ApiClient } from "client/api/api_client";
import { Button, Component, FloatingBanner } from "client/components";

type Props = {
	receiverId: string;
};

type SendMessageRequest = {
	receiverId: string;
	content: string;
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

export class MessageForm extends Component {
	private readonly receiverId: string;
	private isSubmitting: boolean = false;

	constructor({ receiverId }: Props) {
		super();
		this.receiverId = receiverId;
	}

	render(): string {
		return `
      <form id="message-form" class="flex space-x-2">
        <input
          type="text"
          id="message-input"
          name="content"
          placeholder="メッセージを入力..."
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          required
          maxlength="500"
        />
        ${new Button({
					type: "submit",
					text: "送信",
					color: "blue",
				}).render()}
      </form>
    `;
	}

	onLoad(): void {
		const form = document.getElementById("message-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				await this.handleSubmit(form);
			});
		}
	}

	private async handleSubmit(form: HTMLFormElement): Promise<void> {
		// Prevent duplicate submissions
		if (this.isSubmitting) {
			return;
		}

		const formData = new FormData(form);
		const content = formData.get("content") as string;

		if (!content.trim()) {
			new FloatingBanner({
				message: "メッセージを入力してください",
				type: "error",
			}).show();
			return;
		}

		this.isSubmitting = true;

		try {
			const response = await new ApiClient().post<
				SendMessageRequest,
				DirectMessage
			>("/api/dms", {
				receiverId: this.receiverId,
				content: content.trim(),
			});

			// Clear the form
			form.reset();

			// Dispatch custom event to notify parent component
			document.dispatchEvent(
				new CustomEvent("messageSent", {
					detail: { message: response },
				}),
			);
		} catch (error) {
			console.error("Failed to send message:", error);
			new FloatingBanner({
				message: "メッセージの送信に失敗しました",
				type: "error",
			}).show();
		} finally {
			this.isSubmitting = false;
		}
	}
}
