import { ErrBadRequest, ErrForbidden } from "../error";
import type { User, UserId } from "./user";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export class Friendship {
	status: FriendshipStatus;

	constructor(
		readonly requesterId: UserId,
		readonly receiverId: UserId,
		status: FriendshipStatus,
	) {
		this.status = status;
	}

	static create(requester: User, receiver: User): Friendship {
		if (requester.id.equals(receiver.id)) {
			throw new ErrBadRequest({
				userMessage: "自分自身とフレンドシップを作成することはできません。",
			});
		}
		return new Friendship(requester.id, receiver.id, "pending");
	}

	accept(): void {
		if (this.status !== "pending") {
			throw new ErrForbidden();
		}
		this.status = "accepted";
	}

	block(): void {
		if (this.status === "blocked") {
			return;
		}
		this.status = "blocked";
	}

	unblock(): void {
		if (this.status !== "blocked") {
			throw new ErrForbidden();
		}
	}

	isBlocked(): boolean {
		return this.status === "blocked";
	}

	isAccepted(): boolean {
		return this.status === "accepted";
	}
}
