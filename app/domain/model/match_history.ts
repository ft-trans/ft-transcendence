import { ulid } from "ulid";
import type { MatchId } from "./pong";
import type { User, UserId } from "./user";
import { ValueObject } from "./value_object";

export const matchHistoryPageSize = 20;

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
		readonly matchId: MatchId,
		readonly winnerId: UserId,
		readonly loserId: UserId,
		readonly winnerScore: number,
		readonly loserScore: number,
		readonly playedAt: Date,
		readonly winner?: User | undefined,
		readonly loser?: User | undefined,
	) {}

	static create({
		matchId,
		winnerId,
		loserId,
		winnerScore,
		loserScore,
	}: {
		matchId: MatchId;
		winnerId: UserId;
		loserId: UserId;
		winnerScore: number;
		loserScore: number;
	}): MatchHistory {
		const id = new MatchHistoryId(ulid());
		return new MatchHistory(
			id,
			matchId,
			winnerId,
			loserId,
			winnerScore,
			loserScore,
			new Date(),
		);
	}
}
