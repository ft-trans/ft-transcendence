import { ErrBadRequest } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import {
	MaxParticipants,
	RoundNumber,
	Tournament,
	TournamentId,
	TournamentMatch,
	TournamentMatchId,
	type TournamentMatchStatus,
	TournamentMatchStatusValue,
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
} from "./tournament";
import { UserId } from "./user";

describe("TournamentId", () => {
	it("should create a TournamentId instance with a valid ULID", () => {
		const validUlid = ulid();
		expect(() => new TournamentId(validUlid)).not.toThrow();
	});

	it("should throw a BadRequestError for an invalid ULID", () => {
		const invalidUlid = "invalid-ulid";
		expect(() => new TournamentId(invalidUlid)).toThrowError(
			new ErrBadRequest({
				details: {
					tournamentId: "トーナメントIDは有効なULIDである必要があります",
				},
			}),
		);
	});
});

describe("TournamentStatusValue", () => {
	it("should create a TournamentStatusValue instance with valid status", () => {
		const registrationStatus = new TournamentStatusValue("registration");
		const inProgressStatus = new TournamentStatusValue("in_progress");
		const completedStatus = new TournamentStatusValue("completed");
		const cancelledStatus = new TournamentStatusValue("cancelled");

		expect(registrationStatus.value).toBe("registration");
		expect(inProgressStatus.value).toBe("in_progress");
		expect(completedStatus.value).toBe("completed");
		expect(cancelledStatus.value).toBe("cancelled");
	});

	it("should throw a BadRequestError for invalid status", () => {
		expect(
			() => new TournamentStatusValue("invalid" as unknown as TournamentStatus),
		).toThrowError(ErrBadRequest);
	});

	it("should correctly identify status types", () => {
		const registrationStatus = new TournamentStatusValue("registration");
		expect(registrationStatus.isRegistration()).toBe(true);
		expect(registrationStatus.isInProgress()).toBe(false);
		expect(registrationStatus.isCompleted()).toBe(false);
		expect(registrationStatus.isCancelled()).toBe(false);
		expect(registrationStatus.isActive()).toBe(true);

		const completedStatus = new TournamentStatusValue("completed");
		expect(completedStatus.isCompleted()).toBe(true);
		expect(completedStatus.isActive()).toBe(false);
	});
});

describe("MaxParticipants", () => {
	it("should create a MaxParticipants instance with valid number", () => {
		const maxParticipants = new MaxParticipants(4);
		expect(maxParticipants.value).toBe(4);
	});

	it("should throw a BadRequestError for invalid number", () => {
		expect(() => new MaxParticipants(1)).toThrowError(ErrBadRequest);
		expect(() => new MaxParticipants(65)).toThrowError(ErrBadRequest);
	});

	it("should accept boundary values", () => {
		expect(() => new MaxParticipants(2)).not.toThrow();
		expect(() => new MaxParticipants(8)).not.toThrow();
	});
});

describe("Tournament", () => {
	it("should create a tournament with valid parameters", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });

		expect(tournament).toBeInstanceOf(Tournament);
		expect(tournament.id).toBeInstanceOf(TournamentId);
		expect(tournament.organizerId).toBe(organizerId);
		expect(tournament.status.value).toBe("registration");
		expect(tournament.maxParticipants.value).toBe(
			MaxParticipants.DEFAULT_PARTICIPANTS,
		);
	});

	it("should create a tournament with custom max participants", () => {
		const organizerId = new UserId(ulid());
		const maxParticipants = new MaxParticipants(8);
		const tournament = Tournament.create({ organizerId, maxParticipants });

		expect(tournament.maxParticipants).toBe(maxParticipants);
	});

	it("should reconstruct a tournament", () => {
		const id = new TournamentId(ulid());
		const organizerId = new UserId(ulid());
		const status = new TournamentStatusValue("in_progress");
		const maxParticipants = new MaxParticipants(4);

		const tournament = Tournament.reconstruct({
			id,
			organizerId,
			status,
			maxParticipants,
		});

		expect(tournament.id).toBe(id);
		expect(tournament.organizerId).toBe(organizerId);
		expect(tournament.status).toBe(status);
		expect(tournament.maxParticipants).toBe(maxParticipants);
	});

	it("should start a tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });
		const startedTournament = tournament.start();

		expect(startedTournament.status.value).toBe("in_progress");
	});

	it("should throw error when starting non-registration tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId }).start();

		expect(() => tournament.start()).toThrowError(
			new ErrBadRequest({
				userMessage: "登録受付中のトーナメントのみ開始できます",
			}),
		);
	});

	it("should complete a tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId }).start();
		const completedTournament = tournament.complete();

		expect(completedTournament.status.value).toBe("completed");
	});

	it("should throw error when completing non-in-progress tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });

		expect(() => tournament.complete()).toThrowError(
			new ErrBadRequest({
				userMessage: "進行中のトーナメントのみ完了できます",
			}),
		);
	});

	it("should cancel a tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });
		const cancelledTournament = tournament.cancel();

		expect(cancelledTournament.status.value).toBe("cancelled");
	});

	it("should throw error when cancelling completed tournament", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId }).start().complete();

		expect(() => tournament.cancel()).toThrowError(
			new ErrBadRequest({
				userMessage: "完了したトーナメントはキャンセルできません",
			}),
		);
	});

	it("should identify organizer correctly", () => {
		const organizerId = new UserId(ulid());
		const otherId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });

		expect(tournament.isOrganizer(organizerId)).toBe(true);
		expect(tournament.isOrganizer(otherId)).toBe(false);
	});

	it("should correctly identify if registration is allowed", () => {
		const organizerId = new UserId(ulid());
		const tournament = Tournament.create({ organizerId });

		expect(tournament.canRegister()).toBe(true);
		expect(tournament.start().canRegister()).toBe(false);
	});
});

describe("TournamentParticipant", () => {
	it("should create a tournament participant", () => {
		const tournamentId = new TournamentId(ulid());
		const userId = new UserId(ulid());
		const participant = TournamentParticipant.create(tournamentId, userId);

		expect(participant).toBeInstanceOf(TournamentParticipant);
		expect(participant.id).toBeInstanceOf(TournamentParticipantId);
		expect(participant.tournamentId).toBe(tournamentId);
		expect(participant.userId).toBe(userId);
		expect(participant.status.value).toBe("active");
	});

	it("should eliminate a participant", () => {
		const tournamentId = new TournamentId(ulid());
		const userId = new UserId(ulid());
		const participant = TournamentParticipant.create(tournamentId, userId);
		const eliminatedParticipant = participant.eliminate();

		expect(eliminatedParticipant.status.value).toBe("eliminated");
	});

	it("should withdraw a participant", () => {
		const tournamentId = new TournamentId(ulid());
		const userId = new UserId(ulid());
		const participant = TournamentParticipant.create(tournamentId, userId);
		const withdrawnParticipant = participant.withdraw();

		expect(withdrawnParticipant.status.value).toBe("withdrawn");
	});

	it("should throw error when withdrawing non-active participant", () => {
		const tournamentId = new TournamentId(ulid());
		const userId = new UserId(ulid());
		const participant = TournamentParticipant.create(
			tournamentId,
			userId,
		).eliminate();

		expect(() => participant.withdraw()).toThrowError(
			new ErrBadRequest({
				userMessage: "アクティブな参加者のみ棄権できます",
			}),
		);
	});

	it("should correctly identify if participant can compete", () => {
		const tournamentId = new TournamentId(ulid());
		const userId = new UserId(ulid());
		const participant = TournamentParticipant.create(tournamentId, userId);

		expect(participant.canCompete()).toBe(true);
		expect(participant.eliminate().canCompete()).toBe(false);
		expect(participant.withdraw().canCompete()).toBe(false);
	});
});

describe("TournamentParticipantStatusValue", () => {
	it("should create a TournamentParticipantStatusValue instance with valid status", () => {
		const activeStatus = new TournamentParticipantStatusValue("active");
		const eliminatedStatus = new TournamentParticipantStatusValue("eliminated");
		const withdrawnStatus = new TournamentParticipantStatusValue("withdrawn");

		expect(activeStatus.value).toBe("active");
		expect(eliminatedStatus.value).toBe("eliminated");
		expect(withdrawnStatus.value).toBe("withdrawn");
	});

	it("should throw a BadRequestError for invalid status", () => {
		expect(
			() =>
				new TournamentParticipantStatusValue(
					"invalid" as unknown as TournamentParticipantStatus,
				),
		).toThrowError(ErrBadRequest);
	});
});

describe("TournamentRound", () => {
	it("should create a tournament round", () => {
		const tournamentId = new TournamentId(ulid());
		const roundNumber = new RoundNumber(1);
		const round = TournamentRound.create(tournamentId, roundNumber);

		expect(round).toBeInstanceOf(TournamentRound);
		expect(round.id).toBeInstanceOf(TournamentRoundId);
		expect(round.tournamentId).toBe(tournamentId);
		expect(round.roundNumber).toBe(roundNumber);
		expect(round.status.value).toBe("pending");
	});

	it("should start a round", () => {
		const tournamentId = new TournamentId(ulid());
		const roundNumber = new RoundNumber(1);
		const round = TournamentRound.create(tournamentId, roundNumber);
		const startedRound = round.start();

		expect(startedRound.status.value).toBe("in_progress");
	});

	it("should throw error when starting non-pending round", () => {
		const tournamentId = new TournamentId(ulid());
		const roundNumber = new RoundNumber(1);
		const round = TournamentRound.create(tournamentId, roundNumber).start();

		expect(() => round.start()).toThrowError(
			new ErrBadRequest({
				userMessage: "待機中のラウンドのみ開始できます",
			}),
		);
	});

	it("should complete a round", () => {
		const tournamentId = new TournamentId(ulid());
		const roundNumber = new RoundNumber(1);
		const round = TournamentRound.create(tournamentId, roundNumber).start();
		const completedRound = round.complete();

		expect(completedRound.status.value).toBe("completed");
	});

	it("should throw error when completing non-in-progress round", () => {
		const tournamentId = new TournamentId(ulid());
		const roundNumber = new RoundNumber(1);
		const round = TournamentRound.create(tournamentId, roundNumber);

		expect(() => round.complete()).toThrowError(
			new ErrBadRequest({
				userMessage: "進行中のラウンドのみ完了できます",
			}),
		);
	});
});

describe("RoundNumber", () => {
	it("should create a RoundNumber instance with valid number", () => {
		const roundNumber = new RoundNumber(1);
		expect(roundNumber.value).toBe(1);
	});

	it("should throw a BadRequestError for invalid number", () => {
		expect(() => new RoundNumber(0)).toThrowError(ErrBadRequest);
		expect(() => new RoundNumber(-1)).toThrowError(ErrBadRequest);
	});
});

describe("TournamentMatch", () => {
	it("should create a tournament match with two participants", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const match = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);

		expect(match).toBeInstanceOf(TournamentMatch);
		expect(match.id).toBeInstanceOf(TournamentMatchId);
		expect(match.participantIds).toHaveLength(2);
		expect(match.winnerId).toBeUndefined();
		expect(match.status.value).toBe("pending");
	});

	it("should create a tournament match with one participant (BYE)", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participantId = new TournamentParticipantId(ulid());
		const match = TournamentMatch.create(tournamentId, roundId, [
			participantId,
		]);

		expect(match.participantIds).toHaveLength(1);
		expect(match.isBye()).toBe(true);
	});

	it("should throw error when creating match with invalid participant count", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());

		expect(() =>
			TournamentMatch.create(tournamentId, roundId, []),
		).toThrowError(
			new ErrBadRequest({
				userMessage: "試合には1人または2人の参加者が必要です",
			}),
		);

		const participants = [
			new TournamentParticipantId(ulid()),
			new TournamentParticipantId(ulid()),
			new TournamentParticipantId(ulid()),
		];
		expect(() =>
			TournamentMatch.create(tournamentId, roundId, participants),
		).toThrowError(
			new ErrBadRequest({
				userMessage: "試合には1人または2人の参加者が必要です",
			}),
		);
	});

	it("should start a match", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const match = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);
		const matchId = ulid();
		const startedMatch = match.start(matchId);

		expect(startedMatch.status.value).toBe("in_progress");
		expect(startedMatch.matchId).toBe(matchId);
	});

	it("should complete a match with winner", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const matchId = ulid();
		const match = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]).start(matchId);
		const completedMatch = match.complete(participant1Id);

		expect(completedMatch.status.value).toBe("completed");
		expect(completedMatch.winnerId).toBe(participant1Id);
	});

	it("should throw error when completing match with non-participant winner", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const nonParticipantId = new TournamentParticipantId(ulid());
		const matchId = ulid();
		const match = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]).start(matchId);

		expect(() => match.complete(nonParticipantId)).toThrowError(
			new ErrBadRequest({
				userMessage: "勝者は試合の参加者である必要があります",
			}),
		);
	});

	it("should complete a BYE match automatically", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participantId = new TournamentParticipantId(ulid());
		const match = TournamentMatch.create(tournamentId, roundId, [
			participantId,
		]);
		const completedMatch = match.completeAsBye();

		expect(completedMatch.status.value).toBe("completed");
		expect(completedMatch.winnerId).toBe(participantId);
	});

	it("should throw error when completing non-BYE match as BYE", () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const match = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);

		expect(() => match.completeAsBye()).toThrowError(
			new ErrBadRequest({
				userMessage: "BYEは参加者が1人の試合のみ適用できます",
			}),
		);
	});
});

describe("TournamentMatchStatusValue", () => {
	it("should create a TournamentMatchStatusValue instance with valid status", () => {
		const pendingStatus = new TournamentMatchStatusValue("pending");
		const inProgressStatus = new TournamentMatchStatusValue("in_progress");
		const completedStatus = new TournamentMatchStatusValue("completed");

		expect(pendingStatus.value).toBe("pending");
		expect(inProgressStatus.value).toBe("in_progress");
		expect(completedStatus.value).toBe("completed");
	});

	it("should throw a BadRequestError for invalid status", () => {
		expect(
			() =>
				new TournamentMatchStatusValue(
					"invalid" as unknown as TournamentMatchStatus,
				),
		).toThrowError(ErrBadRequest);
	});
});

describe("TournamentRoundStatusValue", () => {
	it("should create a TournamentRoundStatusValue instance with valid status", () => {
		const pendingStatus = new TournamentRoundStatusValue("pending");
		const inProgressStatus = new TournamentRoundStatusValue("in_progress");
		const completedStatus = new TournamentRoundStatusValue("completed");

		expect(pendingStatus.value).toBe("pending");
		expect(inProgressStatus.value).toBe("in_progress");
		expect(completedStatus.value).toBe("completed");
	});

	it("should throw a BadRequestError for invalid status", () => {
		expect(
			() =>
				new TournamentRoundStatusValue(
					"invalid" as unknown as TournamentRoundStatus,
				),
		).toThrowError(ErrBadRequest);
	});
});
