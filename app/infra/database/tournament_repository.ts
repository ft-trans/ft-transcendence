import {
	MaxParticipants,
	RoundNumber,
	Tournament,
	TournamentDescription,
	TournamentId,
	TournamentMatch,
	TournamentMatchId,
	type TournamentMatchStatus,
	TournamentMatchStatusValue,
	TournamentName,
	TournamentParticipant,
	TournamentParticipantId,
	type TournamentParticipantStatus,
	TournamentParticipantStatusValue,
	TournamentRound,
	TournamentRoundId,
	type TournamentRoundStatus,
	TournamentRoundStatusValue,
	type TournamentStatus,
	TournamentStatusValue,
	UserId,
} from "@domain/model";
import type { ITournamentRepository } from "@domain/repository";
import type { Client } from "./prisma";

export class TournamentRepository implements ITournamentRepository {
	constructor(private readonly client: Client) {}

	// Tournament CRUD operations
	async create(tournament: Tournament): Promise<Tournament> {
		const createdTournament = await this.client.tournament.create({
			data: {
				id: tournament.id.value,
				name: tournament.name.value,
				description: tournament.description.value ?? null,
				organizerId: tournament.organizerId.value,
				status: tournament.status.value,
				maxParticipants: tournament.maxParticipants.value,
			},
		});

		return Tournament.reconstruct({
			id: new TournamentId(createdTournament.id),
			name: new TournamentName(createdTournament.name),
			description: new TournamentDescription(
				createdTournament.description ?? undefined,
			),
			organizerId: new UserId(createdTournament.organizerId),
			status: new TournamentStatusValue(
				createdTournament.status as TournamentStatus,
			),
			maxParticipants: new MaxParticipants(createdTournament.maxParticipants),
		});
	}

	async update(tournament: Tournament): Promise<Tournament> {
		const updatedTournament = await this.client.tournament.update({
			where: {
				id: tournament.id.value,
			},
			data: {
				name: tournament.name.value,
				description: tournament.description.value ?? null,
				status: tournament.status.value,
				maxParticipants: tournament.maxParticipants.value,
			},
		});

		return Tournament.reconstruct({
			id: new TournamentId(updatedTournament.id),
			name: new TournamentName(updatedTournament.name),
			description: new TournamentDescription(
				updatedTournament.description ?? undefined,
			),
			organizerId: new UserId(updatedTournament.organizerId),
			status: new TournamentStatusValue(
				updatedTournament.status as TournamentStatus,
			),
			maxParticipants: new MaxParticipants(updatedTournament.maxParticipants),
		});
	}

	async delete(id: TournamentId): Promise<Tournament> {
		const deletedTournament = await this.client.tournament.delete({
			where: {
				id: id.value,
			},
		});

		return Tournament.reconstruct({
			id: new TournamentId(deletedTournament.id),
			name: new TournamentName(deletedTournament.name),
			description: new TournamentDescription(
				deletedTournament.description ?? undefined,
			),
			organizerId: new UserId(deletedTournament.organizerId),
			status: new TournamentStatusValue(
				deletedTournament.status as TournamentStatus,
			),
			maxParticipants: new MaxParticipants(deletedTournament.maxParticipants),
		});
	}

	async findById(id: TournamentId): Promise<Tournament | undefined> {
		const tournament = await this.client.tournament.findUnique({
			where: {
				id: id.value,
			},
		});

		if (!tournament) {
			return undefined;
		}

		return Tournament.reconstruct({
			id: new TournamentId(tournament.id),
			name: new TournamentName(tournament.name),
			description: new TournamentDescription(
				tournament.description ?? undefined,
			),
			organizerId: new UserId(tournament.organizerId),
			status: new TournamentStatusValue(tournament.status as TournamentStatus),
			maxParticipants: new MaxParticipants(tournament.maxParticipants),
		});
	}

	async findMany(options?: {
		status?: string;
		limit?: number;
		offset?: number;
	}): Promise<Tournament[]> {
		const { status, limit = 50, offset = 0 } = options || {};

		const tournaments = await this.client.tournament.findMany({
			where: {
				...(status && { status }),
			},
			take: limit,
			skip: offset,
			orderBy: {
				createdAt: "desc",
			},
		});

		return tournaments.map((tournament) =>
			Tournament.reconstruct({
				id: new TournamentId(tournament.id),
				name: new TournamentName(tournament.name),
				description: new TournamentDescription(
					tournament.description ?? undefined,
				),
				organizerId: new UserId(tournament.organizerId),
				status: new TournamentStatusValue(
					tournament.status as TournamentStatus,
				),
				maxParticipants: new MaxParticipants(tournament.maxParticipants),
			}),
		);
	}

	// TournamentParticipant operations
	async createParticipant(
		participant: TournamentParticipant,
	): Promise<TournamentParticipant> {
		const createdParticipant = await this.client.tournamentParticipant.create({
			data: {
				id: participant.id.value,
				tournamentId: participant.tournamentId.value,
				userId: participant.userId.value,
				status: participant.status.value,
			},
		});

		return TournamentParticipant.reconstruct(
			new TournamentParticipantId(createdParticipant.id),
			new TournamentId(createdParticipant.tournamentId),
			new UserId(createdParticipant.userId),
			new TournamentParticipantStatusValue(
				createdParticipant.status as TournamentParticipantStatus,
			),
		);
	}

	async updateParticipant(
		participant: TournamentParticipant,
	): Promise<TournamentParticipant> {
		const updatedParticipant = await this.client.tournamentParticipant.update({
			where: {
				id: participant.id.value,
			},
			data: {
				status: participant.status.value,
			},
		});

		return TournamentParticipant.reconstruct(
			new TournamentParticipantId(updatedParticipant.id),
			new TournamentId(updatedParticipant.tournamentId),
			new UserId(updatedParticipant.userId),
			new TournamentParticipantStatusValue(
				updatedParticipant.status as TournamentParticipantStatus,
			),
		);
	}

	async deleteParticipant(
		id: TournamentParticipantId,
	): Promise<TournamentParticipant> {
		const deletedParticipant = await this.client.tournamentParticipant.delete({
			where: {
				id: id.value,
			},
		});

		return TournamentParticipant.reconstruct(
			new TournamentParticipantId(deletedParticipant.id),
			new TournamentId(deletedParticipant.tournamentId),
			new UserId(deletedParticipant.userId),
			new TournamentParticipantStatusValue(
				deletedParticipant.status as TournamentParticipantStatus,
			),
		);
	}

	async findParticipantById(
		id: TournamentParticipantId,
	): Promise<TournamentParticipant | undefined> {
		const participant = await this.client.tournamentParticipant.findUnique({
			where: {
				id: id.value,
			},
		});

		if (!participant) {
			return undefined;
		}

		return TournamentParticipant.reconstruct(
			new TournamentParticipantId(participant.id),
			new TournamentId(participant.tournamentId),
			new UserId(participant.userId),
			new TournamentParticipantStatusValue(
				participant.status as TournamentParticipantStatus,
			),
		);
	}

	async findParticipantsByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentParticipant[]> {
		const participants = await this.client.tournamentParticipant.findMany({
			where: {
				tournamentId: tournamentId.value,
			},
		});

		return participants.map((participant) =>
			TournamentParticipant.reconstruct(
				new TournamentParticipantId(participant.id),
				new TournamentId(participant.tournamentId),
				new UserId(participant.userId),
				new TournamentParticipantStatusValue(
					participant.status as TournamentParticipantStatus,
				),
			),
		);
	}

	async findParticipantByTournamentAndUserId(
		tournamentId: TournamentId,
		userId: string,
	): Promise<TournamentParticipant | undefined> {
		const participant = await this.client.tournamentParticipant.findUnique({
			where: {
				tournamentId_userId: {
					tournamentId: tournamentId.value,
					userId: userId,
				},
			},
		});

		if (!participant) {
			return undefined;
		}

		return TournamentParticipant.reconstruct(
			new TournamentParticipantId(participant.id),
			new TournamentId(participant.tournamentId),
			new UserId(participant.userId),
			new TournamentParticipantStatusValue(
				participant.status as TournamentParticipantStatus,
			),
		);
	}

	// TournamentRound operations
	async createRound(round: TournamentRound): Promise<TournamentRound> {
		const createdRound = await this.client.tournamentRound.create({
			data: {
				id: round.id.value,
				tournamentId: round.tournamentId.value,
				roundNumber: round.roundNumber.value,
				status: round.status.value,
			},
		});

		return TournamentRound.reconstruct(
			new TournamentRoundId(createdRound.id),
			new TournamentId(createdRound.tournamentId),
			new RoundNumber(createdRound.roundNumber),
			new TournamentRoundStatusValue(
				createdRound.status as TournamentRoundStatus,
			),
		);
	}

	async updateRound(round: TournamentRound): Promise<TournamentRound> {
		const updatedRound = await this.client.tournamentRound.update({
			where: {
				id: round.id.value,
			},
			data: {
				status: round.status.value,
			},
		});

		return TournamentRound.reconstruct(
			new TournamentRoundId(updatedRound.id),
			new TournamentId(updatedRound.tournamentId),
			new RoundNumber(updatedRound.roundNumber),
			new TournamentRoundStatusValue(
				updatedRound.status as TournamentRoundStatus,
			),
		);
	}

	async findRoundById(
		id: TournamentRoundId,
	): Promise<TournamentRound | undefined> {
		const round = await this.client.tournamentRound.findUnique({
			where: {
				id: id.value,
			},
		});

		if (!round) {
			return undefined;
		}

		return TournamentRound.reconstruct(
			new TournamentRoundId(round.id),
			new TournamentId(round.tournamentId),
			new RoundNumber(round.roundNumber),
			new TournamentRoundStatusValue(round.status as TournamentRoundStatus),
		);
	}

	async findRoundsByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentRound[]> {
		const rounds = await this.client.tournamentRound.findMany({
			where: {
				tournamentId: tournamentId.value,
			},
			orderBy: {
				roundNumber: "asc",
			},
		});

		return rounds.map((round) =>
			TournamentRound.reconstruct(
				new TournamentRoundId(round.id),
				new TournamentId(round.tournamentId),
				new RoundNumber(round.roundNumber),
				new TournamentRoundStatusValue(round.status as TournamentRoundStatus),
			),
		);
	}

	// TournamentMatch operations
	async createMatch(match: TournamentMatch): Promise<TournamentMatch> {
		// Create match and participants in a transaction
		const createdMatch = await this.client.tournamentMatch.create({
			data: {
				id: match.id.value,
				tournamentId: match.tournamentId.value,
				roundId: match.roundId.value,
				matchId: match.matchId ?? null,
				winnerId: match.winnerId?.value ?? null,
				status: match.status.value,
				participants: {
					create: match.participantIds.map((participantId) => ({
						participantId: participantId.value,
					})),
				},
			},
			include: {
				participants: true,
			},
		});

		return TournamentMatch.reconstruct(
			new TournamentMatchId(createdMatch.id),
			new TournamentId(createdMatch.tournamentId),
			new TournamentRoundId(createdMatch.roundId),
			createdMatch.participants.map(
				(p) => new TournamentParticipantId(p.participantId),
			),
			createdMatch.matchId ?? undefined,
			createdMatch.winnerId
				? new TournamentParticipantId(createdMatch.winnerId)
				: undefined,
			new TournamentMatchStatusValue(
				createdMatch.status as TournamentMatchStatus,
			),
		);
	}

	async updateMatch(match: TournamentMatch): Promise<TournamentMatch> {
		const updatedMatch = await this.client.tournamentMatch.update({
			where: {
				id: match.id.value,
			},
			data: {
				matchId: match.matchId ?? null,
				winnerId: match.winnerId?.value ?? null,
				status: match.status.value,
			},
			include: {
				participants: true,
			},
		});

		return TournamentMatch.reconstruct(
			new TournamentMatchId(updatedMatch.id),
			new TournamentId(updatedMatch.tournamentId),
			new TournamentRoundId(updatedMatch.roundId),
			updatedMatch.participants.map(
				(p) => new TournamentParticipantId(p.participantId),
			),
			updatedMatch.matchId ?? undefined,
			updatedMatch.winnerId
				? new TournamentParticipantId(updatedMatch.winnerId)
				: undefined,
			new TournamentMatchStatusValue(
				updatedMatch.status as TournamentMatchStatus,
			),
		);
	}

	async findMatchById(
		id: TournamentMatchId,
	): Promise<TournamentMatch | undefined> {
		const match = await this.client.tournamentMatch.findUnique({
			where: {
				id: id.value,
			},
			include: {
				participants: true,
			},
		});

		if (!match) {
			return undefined;
		}

		return TournamentMatch.reconstruct(
			new TournamentMatchId(match.id),
			new TournamentId(match.tournamentId),
			new TournamentRoundId(match.roundId),
			match.participants.map(
				(p) => new TournamentParticipantId(p.participantId),
			),
			match.matchId ?? undefined,
			match.winnerId ? new TournamentParticipantId(match.winnerId) : undefined,
			new TournamentMatchStatusValue(match.status as TournamentMatchStatus),
		);
	}

	async findMatchesByRoundId(
		roundId: TournamentRoundId,
	): Promise<TournamentMatch[]> {
		const matches = await this.client.tournamentMatch.findMany({
			where: {
				roundId: roundId.value,
			},
			include: {
				participants: true,
			},
		});

		return matches.map((match) =>
			TournamentMatch.reconstruct(
				new TournamentMatchId(match.id),
				new TournamentId(match.tournamentId),
				new TournamentRoundId(match.roundId),
				match.participants.map(
					(p) => new TournamentParticipantId(p.participantId),
				),
				match.matchId ?? undefined,
				match.winnerId
					? new TournamentParticipantId(match.winnerId)
					: undefined,
				new TournamentMatchStatusValue(match.status as TournamentMatchStatus),
			),
		);
	}

	async findMatchesByTournamentId(
		tournamentId: TournamentId,
	): Promise<TournamentMatch[]> {
		const matches = await this.client.tournamentMatch.findMany({
			where: {
				tournamentId: tournamentId.value,
			},
			include: {
				participants: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		return matches.map((match) =>
			TournamentMatch.reconstruct(
				new TournamentMatchId(match.id),
				new TournamentId(match.tournamentId),
				new TournamentRoundId(match.roundId),
				match.participants.map(
					(p) => new TournamentParticipantId(p.participantId),
				),
				match.matchId ?? undefined,
				match.winnerId
					? new TournamentParticipantId(match.winnerId)
					: undefined,
				new TournamentMatchStatusValue(match.status as TournamentMatchStatus),
			),
		);
	}

	async findMatchByMatchId(
		matchId: string,
	): Promise<TournamentMatch | undefined> {
		const match = await this.client.tournamentMatch.findFirst({
			where: {
				matchId: matchId,
			},
			include: {
				participants: true,
			},
		});

		if (!match) {
			return undefined;
		}

		return TournamentMatch.reconstruct(
			new TournamentMatchId(match.id),
			new TournamentId(match.tournamentId),
			new TournamentRoundId(match.roundId),
			match.participants.map(
				(p) => new TournamentParticipantId(p.participantId),
			),
			match.matchId ?? undefined,
			match.winnerId ? new TournamentParticipantId(match.winnerId) : undefined,
			new TournamentMatchStatusValue(match.status as TournamentMatchStatus),
		);
	}
}
