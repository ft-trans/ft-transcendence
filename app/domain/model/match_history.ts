import { ulid } from "ulid";
import type { User } from "./user";

export class MatchHistory {
	constructor(
		readonly id: string,
		readonly winner: User,
		readonly loser: User,
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
		const id = ulid();
		return new MatchHistory(
			id,
			winner,
			loser,
			winnerScore,
			loserScore,
			new Date(),
		);
	}
}
