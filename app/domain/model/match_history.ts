import { ulid } from "ulid";
import type { User, UserEmail, UserId } from "./user";
import { ValueObject } from "./value_object";

export class MatchHistoryId extends ValueObject<string, "MatchHistoryId"> {
	protected validate(value: string): void {
		if (value.length === 0) {
			throw new Error("MatchHistoryId cannot be empty");
		}
	}
}

export class MatchHistory {
	constructor(
		readonly id: MatchHistoryId,
		readonly winnerId: UserId,
		readonly loserId: UserId,
		readonly winnerEmail: UserEmail,
		readonly loserEmail: UserEmail,
		readonly winnerScore: number,
		readonly loserScore: number,
		readonly playedAt: Date,
	) {}

	static create(
		winner: User,
		loser: User,
		winnerScore: number,
		loserScore: number,
	): MatchHistory {
		const id = new MatchHistoryId(ulid());
		return new MatchHistory(
			id,
			winner.id,
			loser.id,
			winner.email,
			loser.email,
			winnerScore,
			loserScore,
			new Date(),
		);
	}
}
