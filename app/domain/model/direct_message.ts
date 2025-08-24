import { ulid } from "ulid";
import { ErrBadRequest } from "../error";
import type { User } from "./user";

export class DirectMessage {
	isRead: boolean;

	constructor(
		readonly id: string,
		readonly sender: User,
		readonly receiver: User,
		readonly content: string,
		isRead: boolean,
		readonly sentAt: Date,
	) {
		this.isRead = isRead;
	}

	static create(sender: User, receiver: User, content: string): DirectMessage {
		if (sender.id.equals(receiver.id)) {
			throw new ErrBadRequest({
				userMessage: "Cannot send a message to oneself.",
			});
		}
		const id = ulid();
		return new DirectMessage(id, sender, receiver, content, false, new Date());
	}

	markAsRead(): void {
		this.isRead = true;
	}
}
