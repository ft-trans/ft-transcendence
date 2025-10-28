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

		// 5人の場合、最初の4人でマッチを作成（1人は自動的に次のラウンドに進む）
		const matchParticipants = shuffledParticipants.slice(0, 4);

		for (let i = 0; i < matchParticipants.length; i += 2) {
			const match = TournamentMatch.create(tournamentId, roundId, [
				matchParticipants[i],
				matchParticipants[i + 1],
			]);
			matches.push(match);
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

		// ペアを作成（奇数の場合、最後の1人は次のラウンドに自動進出）
		const pairCount = Math.floor(winnerIds.length / 2);
		for (let i = 0; i < pairCount; i++) {
			const match = TournamentMatch.create(tournamentId, roundId, [
				winnerIds[i * 2],
				winnerIds[i * 2 + 1],
			]);
			matches.push(match);
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
