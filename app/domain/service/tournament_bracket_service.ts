import type {
	TournamentId,
	TournamentParticipantId,
	TournamentRoundId,
} from "../model";
import { TournamentMatch } from "../model";

export class TournamentBracketService {
	constructor(
		private readonly shuffleFn: <T>(array: T[]) => T[] = defaultShuffle,
	) {}

	generateFirstRoundMatches(
		tournamentId: TournamentId,
		roundId: TournamentRoundId,
		participantIds: TournamentParticipantId[],
	): TournamentMatch[] {
		const matches: TournamentMatch[] = [];
		const shuffledParticipants = this.shuffleFn([...participantIds]);

		for (let i = 0; i < shuffledParticipants.length; i += 2) {
			if (i + 1 < shuffledParticipants.length) {
				const match = TournamentMatch.create(tournamentId, roundId, [
					shuffledParticipants[i],
					shuffledParticipants[i + 1],
				]);
				matches.push(match);
			} else {
				const match = TournamentMatch.create(tournamentId, roundId, [
					shuffledParticipants[i],
				]);
				matches.push(match);
			}
		}

		return matches;
	}

	calculateNextRoundMatchCount(currentWinnerCount: number): number {
		return Math.ceil(currentWinnerCount / 2);
	}

	generateNextRoundMatches(
		tournamentId: TournamentId,
		roundId: TournamentRoundId,
		winnerIds: TournamentParticipantId[],
	): TournamentMatch[] {
		const matches: TournamentMatch[] = [];

		for (let i = 0; i < winnerIds.length; i += 2) {
			if (i + 1 < winnerIds.length) {
				const match = TournamentMatch.create(tournamentId, roundId, [
					winnerIds[i],
					winnerIds[i + 1],
				]);
				matches.push(match);
			} else {
				const match = TournamentMatch.create(tournamentId, roundId, [
					winnerIds[i],
				]);
				matches.push(match);
			}
		}

		return matches;
	}
}

function defaultShuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
