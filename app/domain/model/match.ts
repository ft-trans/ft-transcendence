import { ulid } from "ulid";
import { ErrBadRequest } from "../error";
import type { User } from "./user";

export type MatchStatus = "in_progress" | "completed";
export type GameType = "Pong";

export class Match {
	status: MatchStatus;
	updatedAt: Date;

	constructor(
		readonly id: string,
		readonly participants: User[],
		status: MatchStatus,
		readonly gameType: GameType,
		readonly createdAt: Date,
		updatedAt: Date,
	) {
		this.status = status;
		this.updatedAt = updatedAt;
	}

	static create(participants: User[], gameType: GameType = "Pong"): Match {
		if (participants.length < 2) {
			throw new ErrBadRequest({
				userMessage: "A match requires at least 2 participants.",
			});
		}
		const id = ulid();
		return new Match(
			id,
			participants,
			"in_progress",
			gameType,
			new Date(),
			new Date(),
		);
	}

	complete(): void {
		this.status = "completed";
		this.updatedAt = new Date();
	}
}
