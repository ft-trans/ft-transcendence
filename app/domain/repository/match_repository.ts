import type { Match } from "../model/match";

export interface IMatchRepository {
	save(match: Match): Promise<Match>;
	findById(id: string): Promise<Match | null>;
	findInProgressMatchByUserId(userId: string): Promise<Match | null>;
}
