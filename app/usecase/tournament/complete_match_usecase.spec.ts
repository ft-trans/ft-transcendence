import { ErrBadRequest } from "@domain/error";
import {
	MaxParticipants,
	RoundNumber,
	Tournament,
	TournamentDescription,
	TournamentId,
	TournamentMatch,
	TournamentMatchId,
	TournamentMatchStatusValue,
	TournamentName,
	TournamentParticipant,
	TournamentParticipantId,
	TournamentParticipantStatusValue,
	TournamentRound,
	TournamentRoundId,
	TournamentRoundStatusValue,
	TournamentStatusValue,
} from "@domain/model";
import { UserId } from "@domain/model/user";
import type { ITournamentRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { CompleteMatchUsecase } from "./complete_match_usecase";

describe("CompleteMatchUsecase", () => {
	let mockTx: ITransaction;
	let mockTournamentRepo: ITournamentRepository;

	beforeEach(() => {
		mockTournamentRepo = mock<ITournamentRepository>();
		mockTx = mock<ITransaction>({
			exec: vi.fn((callback) =>
				callback(
					createMockRepository({
						newTournamentRepository: () => mockTournamentRepo,
					}),
				),
			),
		});
	});

	it("should complete a match and update loser status to eliminated", async () => {
		const tournamentId = new TournamentId(ulid());
		const organizerId = new UserId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new TournamentMatchId(ulid());
		const user1Id = new UserId(ulid());
		const user2Id = new UserId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const tournament = Tournament.reconstruct({
			id: tournamentId,
			name: new TournamentName("Test Tournament"),
			description: new TournamentDescription(undefined),
			organizerId,
			status: new TournamentStatusValue("in_progress"),
			maxParticipants: new MaxParticipants(4),
		});

		const match = TournamentMatch.reconstruct(
			matchId,
			tournamentId,
			roundId,
			[participant1Id, participant2Id],
			undefined, // matchId
			undefined, // winnerId
			new TournamentMatchStatusValue("in_progress"),
		);

		const participant1 = TournamentParticipant.reconstruct(
			participant1Id,
			tournamentId,
			user1Id,
			new TournamentParticipantStatusValue("active"),
		);
		const participant2 = TournamentParticipant.reconstruct(
			participant2Id,
			tournamentId,
			user2Id,
			new TournamentParticipantStatusValue("active"),
		);

		const round = TournamentRound.reconstruct(
			roundId,
			tournamentId,
			new RoundNumber(1),
			new TournamentRoundStatusValue("in_progress"),
		);

		// Assume another match is still in progress
		const anotherMatchId = new TournamentMatchId(ulid());
		const anotherMatch = TournamentMatch.reconstruct(
			anotherMatchId,
			tournamentId,
			roundId,
			[
				new TournamentParticipantId(ulid()),
				new TournamentParticipantId(ulid()),
			],
			undefined, // matchId
			undefined, // winnerId
			new TournamentMatchStatusValue("in_progress"),
		);

		mockTournamentRepo.findMatchById = vi.fn().mockResolvedValue(match);
		mockTournamentRepo.findById = vi.fn().mockResolvedValue(tournament);
		mockTournamentRepo.updateMatch = vi
			.fn()
			.mockImplementation((m) => Promise.resolve(m));
		mockTournamentRepo.findParticipantById = vi
			.fn()
			.mockImplementation((id) => {
				if (id.equals(participant1Id)) return Promise.resolve(participant1);
				if (id.equals(participant2Id)) return Promise.resolve(participant2);
				return Promise.resolve(undefined);
			});
		mockTournamentRepo.updateParticipant = vi
			.fn()
			.mockImplementation((p) => Promise.resolve(p));
		mockTournamentRepo.findRoundById = vi.fn().mockResolvedValue(round);
		mockTournamentRepo.findMatchesByRoundId = vi
			.fn()
			.mockResolvedValue([match, anotherMatch]);

		const usecase = new CompleteMatchUsecase(mockTx);
		const result = await usecase.execute({
			matchId: matchId.value,
			winnerId: participant1Id.value,
			requesterId: organizerId.value, // 主催者として実行
		});

		expect(result.match.winnerId?.equals(participant1Id)).toBe(true);
		expect(result.match.status.isCompleted()).toBe(true);
		expect(result.isRoundCompleted).toBe(false);
		expect(result.isTournamentCompleted).toBe(false);
		expect(mockTournamentRepo.updateParticipant).toHaveBeenCalled();
	});

	it("should complete round when all matches are completed", async () => {
		const tournamentId = new TournamentId(ulid());
		const organizerId = new UserId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new TournamentMatchId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const tournament = Tournament.reconstruct({
			id: tournamentId,
			name: new TournamentName("Test Tournament"),
			description: new TournamentDescription(undefined),
			organizerId,
			status: new TournamentStatusValue("in_progress"),
			maxParticipants: new MaxParticipants(4),
		});

		const match = TournamentMatch.reconstruct(
			matchId,
			tournamentId,
			roundId,
			[participant1Id, participant2Id],
			undefined, // matchId
			undefined, // winnerId
			new TournamentMatchStatusValue("in_progress"),
		);

		// Another match that is already completed
		const anotherMatchId = new TournamentMatchId(ulid());
		const participant3Id = new TournamentParticipantId(ulid());
		const participant4Id = new TournamentParticipantId(ulid());
		const anotherMatch = TournamentMatch.reconstruct(
			anotherMatchId,
			tournamentId,
			roundId,
			[participant3Id, participant4Id],
			undefined, // matchId
			participant3Id, // winnerId
			new TournamentMatchStatusValue("completed"),
		);

		const round = TournamentRound.reconstruct(
			roundId,
			tournamentId,
			new RoundNumber(1),
			new TournamentRoundStatusValue("in_progress"),
		);

		mockTournamentRepo.findMatchById = vi.fn().mockResolvedValue(match);
		mockTournamentRepo.findById = vi.fn().mockResolvedValue(tournament);
		mockTournamentRepo.updateMatch = vi
			.fn()
			.mockImplementation((m) => Promise.resolve(m));
		mockTournamentRepo.findParticipantById = vi
			.fn()
			.mockResolvedValue(
				TournamentParticipant.create(tournamentId, new UserId(ulid())),
			);
		mockTournamentRepo.updateParticipant = vi
			.fn()
			.mockImplementation((p) => Promise.resolve(p));
		mockTournamentRepo.findRoundById = vi.fn().mockResolvedValue(round);
		mockTournamentRepo.findMatchesByRoundId = vi.fn().mockImplementation(() => {
			// After completing the current match, both are completed
			const completedMatch = match.complete(participant1Id);
			return Promise.resolve([completedMatch, anotherMatch]);
		});
		mockTournamentRepo.updateRound = vi
			.fn()
			.mockImplementation((r) => Promise.resolve(r));
		mockTournamentRepo.createRound = vi
			.fn()
			.mockImplementation((r) => Promise.resolve(r));
		mockTournamentRepo.createMatch = vi
			.fn()
			.mockImplementation((m) => Promise.resolve(m));

		const usecase = new CompleteMatchUsecase(mockTx);
		const result = await usecase.execute({
			matchId: matchId.value,
			winnerId: participant1Id.value,
			requesterId: organizerId.value,
		});

		expect(result.isRoundCompleted).toBe(true);
		expect(result.isTournamentCompleted).toBe(false);
		expect(result.nextRound).toBeDefined();
		expect(result.nextMatches).toBeDefined();
		expect(mockTournamentRepo.updateRound).toHaveBeenCalled();
		expect(mockTournamentRepo.createRound).toHaveBeenCalled();
	});

	it("should complete tournament when only one winner remains", async () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new TournamentMatchId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const match = TournamentMatch.reconstruct(
			matchId,
			tournamentId,
			roundId,
			[participant1Id, participant2Id],
			undefined, // matchId
			undefined, // winnerId
			new TournamentMatchStatusValue("in_progress"),
		);

		const round = TournamentRound.reconstruct(
			roundId,
			tournamentId,
			new RoundNumber(2),
			new TournamentRoundStatusValue("in_progress"),
		);

		const tournament = Tournament.reconstruct({
			id: tournamentId,
			name: new TournamentName("Test Tournament"),
			description: new TournamentDescription(undefined),
			organizerId: new UserId(ulid()),
			status: new TournamentStatusValue("in_progress"),
			maxParticipants: new MaxParticipants(4),
		});

		mockTournamentRepo.findMatchById = vi.fn().mockResolvedValue(match);
		mockTournamentRepo.updateMatch = vi
			.fn()
			.mockImplementation((m) => Promise.resolve(m));
		mockTournamentRepo.findParticipantById = vi
			.fn()
			.mockResolvedValue(
				TournamentParticipant.create(tournamentId, new UserId(ulid())),
			);
		mockTournamentRepo.updateParticipant = vi
			.fn()
			.mockImplementation((p) => Promise.resolve(p));
		mockTournamentRepo.findRoundById = vi.fn().mockResolvedValue(round);
		mockTournamentRepo.findMatchesByRoundId = vi.fn().mockImplementation(() => {
			// Only one match in this round, which is now completed
			const completedMatch = match.complete(participant1Id);
			return Promise.resolve([completedMatch]);
		});
		mockTournamentRepo.updateRound = vi
			.fn()
			.mockImplementation((r) => Promise.resolve(r));
		mockTournamentRepo.findById = vi.fn().mockResolvedValue(tournament);
		mockTournamentRepo.update = vi
			.fn()
			.mockImplementation((t) => Promise.resolve(t));

		const usecase = new CompleteMatchUsecase(mockTx);
		const result = await usecase.execute({
			matchId: matchId.value,
			winnerId: participant1Id.value,
			requesterId: tournament.organizerId.value,
		});

		expect(result.isRoundCompleted).toBe(true);
		expect(result.isTournamentCompleted).toBe(true);
		expect(result.tournament).toBeDefined();
		expect(result.tournament?.status.isCompleted()).toBe(true);
		expect(mockTournamentRepo.update).toHaveBeenCalled();
	});

	it("should throw error if match not found", async () => {
		mockTournamentRepo.findMatchById = vi.fn().mockResolvedValue(undefined);

		const usecase = new CompleteMatchUsecase(mockTx);
		await expect(
			usecase.execute({
				matchId: ulid(),
				winnerId: ulid(),
				requesterId: ulid(),
			}),
		).rejects.toThrow(ErrBadRequest);
	});

	it("should throw error if winner is not a participant", async () => {
		const tournamentId = new TournamentId(ulid());
		const organizerId = new UserId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new TournamentMatchId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const invalidWinnerId = new TournamentParticipantId(ulid());

		const tournament = Tournament.reconstruct({
			id: tournamentId,
			name: new TournamentName("Test Tournament"),
			description: new TournamentDescription(undefined),
			organizerId,
			status: new TournamentStatusValue("in_progress"),
			maxParticipants: new MaxParticipants(4),
		});

		const match = TournamentMatch.reconstruct(
			matchId,
			tournamentId,
			roundId,
			[participant1Id, participant2Id],
			undefined, // matchId
			undefined, // winnerId
			new TournamentMatchStatusValue("in_progress"),
		);

		mockTournamentRepo.findMatchById = vi.fn().mockResolvedValue(match);
		mockTournamentRepo.findById = vi.fn().mockResolvedValue(tournament);

		const usecase = new CompleteMatchUsecase(mockTx);
		await expect(
			usecase.execute({
				matchId: matchId.value,
				winnerId: invalidWinnerId.value,
				requesterId: organizerId.value,
			}),
		).rejects.toThrow(ErrBadRequest);
	});
});
