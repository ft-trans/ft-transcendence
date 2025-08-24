import { ErrBadRequest, ErrForbidden } from "../error";
import type { User, UserId } from "./user";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export class Friendship {
	status: FriendshipStatus;
	updatedAt: Date;

	constructor(
		readonly requesterId: UserId,
		readonly receiverId: UserId,
		status: FriendshipStatus,
		readonly createdAt: Date,
		updatedAt: Date,
	) {
		this.status = status;
		this.updatedAt = updatedAt;
	}

	static create(requester: User, receiver: User): Friendship {
		if (requester.id.equals(receiver.id)) {
			throw new ErrBadRequest({
				userMessage: "Cannot create a friendship with oneself.",
			});
		}
		return new Friendship(
			requester.id,
			receiver.id,
			"pending",
			new Date(),
			new Date(),
		);
	}

	accept(): void {
		if (this.status !== "pending") {
			throw new ErrForbidden();
		}
		this.status = "accepted";
		this.updatedAt = new Date();
	}

	isAccepted(): boolean {
		return this.status === "accepted";
	}
}
