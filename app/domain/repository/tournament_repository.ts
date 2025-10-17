import type {
	Tournament,
	TournamentId,
	TournamentMatch,
	TournamentMatchId,
	TournamentParticipant,
	TournamentParticipantId,
	TournamentRound,
	TournamentRoundId,
} from "../model";

export interface ITournamentRepository {
	// Tournament CRUD operations
	create(tournament: Tournament): Promise<Tournament>;
	update(tournament: Tournament): Promise<Tournament>;
	delete(id: TournamentId): Promise<Tournament>;
	findById(id: TournamentId): Promise<Tournament | undefined>;
	findMany(options?: {
		status?: string;
		limit?: number;
		offset?: number;
	}): Promise<Tournament[]>;

	// TournamentParticipant operations
	createParticipant(
		participant: TournamentParticipant,
	): Promise<TournamentParticipant>;
	updateParticipant(
		participant: TournamentParticipant,
	): Promise<TournamentParticipant>;
	deleteParticipant(
		id: TournamentParticipantId,
	): Promise<TournamentParticipant>;
	findParticipantById(
		id: TournamentParticipantId,
	): Promise<TournamentParticipant | undefined>;
	findParticipantsByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentParticipant[]>;
	findParticipantByTournamentAndUserId(
		tournamentId: TournamentId,
		userId: string,
	): Promise<TournamentParticipant | undefined>;

	// TournamentRound operations
	createRound(round: TournamentRound): Promise<TournamentRound>;
	updateRound(round: TournamentRound): Promise<TournamentRound>;
	findRoundById(id: TournamentRoundId): Promise<TournamentRound | undefined>;
	findRoundsByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentRound[]>;

	// TournamentMatch operations
	createMatch(match: TournamentMatch): Promise<TournamentMatch>;
	updateMatch(match: TournamentMatch): Promise<TournamentMatch>;
	findMatchById(id: TournamentMatchId): Promise<TournamentMatch | undefined>;
	findMatchesByRoundId(roundId: TournamentRoundId): Promise<TournamentMatch[]>;
	findMatchesByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentMatch[]>;
}
