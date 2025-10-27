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
				userMessage: "試合には少なくとも2人の参加者が必要です。",
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
		if (this.status !== "in_progress") {
			throw new ErrBadRequest({
				userMessage: "進行中ではない試合は完了できません。",
			});
		}
		this.status = "completed";
		this.updatedAt = new Date();
	}
}
