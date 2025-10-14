import { ErrBadRequest } from "@domain/error";
import {
	MatchHistory,
	MatchId,
	MaxParticipants,
	RoundNumber,
	Tournament,
	TournamentId,
	TournamentMatch,
	TournamentMatchId,
	TournamentParticipant,
	TournamentParticipantId,
	TournamentParticipantStatusValue,
	TournamentRound,
	TournamentRoundId,
	TournamentRoundStatusValue,
	TournamentStatusValue,
	UserId,
} from "@domain/model";
import type {
	IMatchHistoryRepository,
	IMatchRepository,
	ITournamentRepository,
	IUserRepository,
} from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { CompleteMatchUsecase } from "./complete_match_usecase";

describe("CompleteMatchUsecase", () => {
	let mockTx: ITransaction;
	let mockTournamentRepo: ITournamentRepository;
	let mockMatchRepo: IMatchRepository;
	let mockMatchHistoryRepo: IMatchHistoryRepository;
	let mockUserRepo: IUserRepository;

	beforeEach(() => {
		mockTournamentRepo = mock<ITournamentRepository>();
		mockMatchRepo = mock<IMatchRepository>();
		mockMatchHistoryRepo = mock<IMatchHistoryRepository>();
		mockUserRepo = mock<IUserRepository>();
		mockTx = mock<ITransaction>({
			exec: vi.fn((callback) =>
				callback(
					createMockRepository({
						newTournamentRepository: () => mockTournamentRepo,
						newMatchRepository: () => mockMatchRepo,
						newMatchHistoryRepository: () => mockMatchHistoryRepo,
						newUserRepository: () => mockUserRepo,
					}),
				),
			),
		});
	});

	it("should complete a match and update loser status to eliminated", async () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new MatchId(ulid());
		const tournamentMatchId = new TournamentMatchId(ulid());
		const user1Id = new UserId(ulid());
		const user2Id = new UserId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const tournamentMatch = TournamentMatch.reconstruct(
			tournamentMatchId,
			tournamentId,
			roundId,
			matchId,
			[participant1Id, participant2Id],
		);

		const matchHistory = MatchHistory.create({
			matchId,
			winnerId: user1Id,
			loserId: user2Id,
			winnerScore: 11,
			loserScore: 5,
		});

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

		// Assume another match is still in progress (no MatchHistory)
		const anotherMatchId = new MatchId(ulid());
		const anotherTournamentMatchId = new TournamentMatchId(ulid());
		const anotherTournamentMatch = TournamentMatch.reconstruct(
			anotherTournamentMatchId,
			tournamentId,
			roundId,
			anotherMatchId,
			[
				new TournamentParticipantId(ulid()),
				new TournamentParticipantId(ulid()),
			],
		);

		mockTournamentRepo.findMatchById = vi
			.fn()
			.mockResolvedValue(tournamentMatch);
		mockMatchHistoryRepo.findByMatchId = vi.fn().mockImplementation((id) => {
			if (id.equals(matchId)) return Promise.resolve(matchHistory);
			return Promise.resolve(undefined);
		});
		mockTournamentRepo.findParticipantByTournamentAndUserId = vi
			.fn()
			.mockImplementation((_, userId) => {
				if (userId === user1Id.value) return Promise.resolve(participant1);
				if (userId === user2Id.value) return Promise.resolve(participant2);
				return Promise.resolve(undefined);
			});
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
			.mockResolvedValue([tournamentMatch, anotherTournamentMatch]);

		const usecase = new CompleteMatchUsecase(mockTx);
		const result = await usecase.execute({
			matchId: tournamentMatchId.value,
		});

		expect(result.isRoundCompleted).toBe(false);
		expect(result.isTournamentCompleted).toBe(false);
		expect(mockTournamentRepo.updateParticipant).toHaveBeenCalled();
	});

	it("should complete round when all matches are completed", async () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new MatchId(ulid());
		const tournamentMatchId = new TournamentMatchId(ulid());
		const user1Id = new UserId(ulid());
		const user2Id = new UserId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const tournamentMatch = TournamentMatch.reconstruct(
			tournamentMatchId,
			tournamentId,
			roundId,
			matchId,
			[participant1Id, participant2Id],
		);

		const matchHistory = MatchHistory.create({
			matchId,
			winnerId: user1Id,
			loserId: user2Id,
			winnerScore: 11,
			loserScore: 5,
		});

		// Another match that is already completed
		const anotherMatchId = new MatchId(ulid());
		const anotherTournamentMatchId = new TournamentMatchId(ulid());
		const user3Id = new UserId(ulid());
		const user4Id = new UserId(ulid());
		const participant3Id = new TournamentParticipantId(ulid());
		const participant4Id = new TournamentParticipantId(ulid());
		const anotherTournamentMatch = TournamentMatch.reconstruct(
			anotherTournamentMatchId,
			tournamentId,
			roundId,
			anotherMatchId,
			[participant3Id, participant4Id],
		);

		const anotherMatchHistory = MatchHistory.create({
			matchId: anotherMatchId,
			winnerId: user3Id,
			loserId: user4Id,
			winnerScore: 11,
			loserScore: 7,
		});

		const round = TournamentRound.reconstruct(
			roundId,
			tournamentId,
			new RoundNumber(1),
			new TournamentRoundStatusValue("in_progress"),
		);

		const participant1 = TournamentParticipant.reconstruct(
			participant1Id,
			tournamentId,
			user1Id,
			new TournamentParticipantStatusValue("active"),
		);
		const participant3 = TournamentParticipant.reconstruct(
			participant3Id,
			tournamentId,
			user3Id,
			new TournamentParticipantStatusValue("active"),
		);

		mockTournamentRepo.findMatchById = vi
			.fn()
			.mockResolvedValue(tournamentMatch);
		mockMatchHistoryRepo.findByMatchId = vi.fn().mockImplementation((id) => {
			if (id.equals(matchId)) return Promise.resolve(matchHistory);
			if (id.equals(anotherMatchId))
				return Promise.resolve(anotherMatchHistory);
			return Promise.resolve(undefined);
		});
		mockTournamentRepo.findParticipantByTournamentAndUserId = vi
			.fn()
			.mockImplementation((_, userId) => {
				if (userId === user1Id.value) return Promise.resolve(participant1);
				if (userId === user3Id.value) return Promise.resolve(participant3);
				return Promise.resolve(undefined);
			});
		mockTournamentRepo.findParticipantById = vi
			.fn()
			.mockImplementation((id) => {
				if (id.equals(participant1Id)) return Promise.resolve(participant1);
				if (id.equals(participant3Id)) return Promise.resolve(participant3);
				return Promise.resolve(
					TournamentParticipant.create(tournamentId, new UserId(ulid())),
				);
			});
		mockTournamentRepo.updateParticipant = vi
			.fn()
			.mockImplementation((p) => Promise.resolve(p));
		mockTournamentRepo.findRoundById = vi.fn().mockResolvedValue(round);
		mockTournamentRepo.findMatchesByRoundId = vi
			.fn()
			.mockResolvedValue([tournamentMatch, anotherTournamentMatch]);
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
			matchId: tournamentMatchId.value,
		});

		expect(result.isRoundCompleted).toBe(true);
		expect(result.isTournamentCompleted).toBe(false);
		expect(result.nextRound).toBeDefined();
		expect(mockTournamentRepo.updateRound).toHaveBeenCalled();
		expect(mockTournamentRepo.createRound).toHaveBeenCalled();
	});

	it("should complete tournament when only one winner remains", async () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new MatchId(ulid());
		const tournamentMatchId = new TournamentMatchId(ulid());
		const user1Id = new UserId(ulid());
		const user2Id = new UserId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());

		const tournamentMatch = TournamentMatch.reconstruct(
			tournamentMatchId,
			tournamentId,
			roundId,
			matchId,
			[participant1Id, participant2Id],
		);

		const matchHistory = MatchHistory.create({
			matchId,
			winnerId: user1Id,
			loserId: user2Id,
			winnerScore: 11,
			loserScore: 5,
		});

		const round = TournamentRound.reconstruct(
			roundId,
			tournamentId,
			new RoundNumber(2),
			new TournamentRoundStatusValue("in_progress"),
		);

		const tournament = Tournament.reconstruct({
			id: tournamentId,
			organizerId: new UserId(ulid()),
			status: new TournamentStatusValue("in_progress"),
			maxParticipants: new MaxParticipants(4),
		});

		const participant1 = TournamentParticipant.reconstruct(
			participant1Id,
			tournamentId,
			user1Id,
			new TournamentParticipantStatusValue("active"),
		);

		mockTournamentRepo.findMatchById = vi
			.fn()
			.mockResolvedValue(tournamentMatch);
		mockMatchHistoryRepo.findByMatchId = vi
			.fn()
			.mockResolvedValue(matchHistory);
		mockTournamentRepo.findParticipantByTournamentAndUserId = vi
			.fn()
			.mockResolvedValue(participant1);
		mockTournamentRepo.findParticipantById = vi
			.fn()
			.mockResolvedValue(participant1);
		mockTournamentRepo.updateParticipant = vi
			.fn()
			.mockImplementation((p) => Promise.resolve(p));
		mockTournamentRepo.findRoundById = vi.fn().mockResolvedValue(round);
		mockTournamentRepo.findMatchesByRoundId = vi
			.fn()
			.mockResolvedValue([tournamentMatch]);
		mockTournamentRepo.updateRound = vi
			.fn()
			.mockImplementation((r) => Promise.resolve(r));
		mockTournamentRepo.findById = vi.fn().mockResolvedValue(tournament);
		mockTournamentRepo.update = vi
			.fn()
			.mockImplementation((t) => Promise.resolve(t));

		const usecase = new CompleteMatchUsecase(mockTx);
		const result = await usecase.execute({
			matchId: tournamentMatchId.value,
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
			}),
		).rejects.toThrow(ErrBadRequest);
	});

	it("should throw error if winner is not a participant", async () => {
		const tournamentId = new TournamentId(ulid());
		const roundId = new TournamentRoundId(ulid());
		const matchId = new MatchId(ulid());
		const tournamentMatchId = new TournamentMatchId(ulid());
		const participant1Id = new TournamentParticipantId(ulid());
		const participant2Id = new TournamentParticipantId(ulid());
		const invalidWinnerId = new UserId(ulid());

		const tournamentMatch = TournamentMatch.reconstruct(
			tournamentMatchId,
			tournamentId,
			roundId,
			matchId,
			[participant1Id, participant2Id],
		);

		const matchHistory = MatchHistory.create({
			matchId,
			winnerId: invalidWinnerId,
			loserId: new UserId(ulid()),
			winnerScore: 11,
			loserScore: 5,
		});

		mockTournamentRepo.findMatchById = vi
			.fn()
			.mockResolvedValue(tournamentMatch);
		mockMatchHistoryRepo.findByMatchId = vi
			.fn()
			.mockResolvedValue(matchHistory);
		mockTournamentRepo.findParticipantByTournamentAndUserId = vi
			.fn()
			.mockResolvedValue(undefined);

		const usecase = new CompleteMatchUsecase(mockTx);
		await expect(
			usecase.execute({
				matchId: tournamentMatchId.value,
			}),
		).rejects.toThrow(ErrBadRequest);
	});
});
