import { ErrBadRequest } from "@domain/error";
import {
	Tournament,
	TournamentId,
	TournamentMatch,
	TournamentName,
	TournamentParticipant,
	TournamentParticipantId,
	TournamentRoundId,
	User,
	UserEmail,
	UserId,
	Username,
} from "@domain/model";
import type {
	IMatchRepository,
	ITournamentRepository,
	IUserRepository,
} from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { StartTournamentMatchUsecase } from "./start_tournament_match_usecase";

describe("StartTournamentMatchUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should start a tournament match and create a Match", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF2");
		const participant1Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF3",
		);
		const participant2Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF4",
		);
		const user1Id = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF5");
		const user2Id = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF6");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		}).start();
		const tournamentMatch = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);
		const participant1 = TournamentParticipant.create(tournamentId, user1Id);
		const participant2 = TournamentParticipant.create(tournamentId, user2Id);
		const user1 = User.create(
			new UserEmail("user1@example.com"),
			new Username("user1"),
		);
		const user2 = User.create(
			new UserEmail("user2@example.com"),
			new Username("user2"),
		);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(tournamentMatch);
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantById
			.mockResolvedValueOnce(participant1)
			.mockResolvedValueOnce(participant2);
		mockTournamentRepo.updateMatch.mockImplementation(async (match) => match);

		const mockUserRepo = mock<IUserRepository>();
		mockUserRepo.findById
			.mockResolvedValueOnce(user1)
			.mockResolvedValueOnce(user2);

		const mockMatchRepo = mock<IMatchRepository>();
		mockMatchRepo.save.mockImplementation(async (match) => match);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
				newUserRepository: () => mockUserRepo,
				newMatchRepository: () => mockMatchRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: tournamentMatch.id.value,
		};
		const result = await usecase.execute(input);

		expect(result.matchId).toBeDefined();
		expect(mockTournamentRepo.findMatchById).toHaveBeenCalledTimes(1);
		expect(mockTournamentRepo.findById).toHaveBeenCalledTimes(1);
		expect(mockTournamentRepo.findParticipantById).toHaveBeenCalledTimes(2);
		expect(mockUserRepo.findById).toHaveBeenCalledTimes(2);
		expect(mockMatchRepo.save).toHaveBeenCalledTimes(1);
		expect(mockTournamentRepo.updateMatch).toHaveBeenCalledTimes(1);
	});

	it("should throw BadRequestError if tournament match does not exist", async () => {
		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: "01JAJCJCK5XPWQ9A7DRTBHVXF0",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメント試合が見つかりません",
		);
	});

	it("should throw BadRequestError if tournament match is not pending", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF2");
		const participant1Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF3",
		);
		const participant2Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF4",
		);

		const tournamentMatch = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]).start("match-id");

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(tournamentMatch);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: tournamentMatch.id.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"待機中の試合のみ開始できます",
		);
	});

	it("should throw BadRequestError if tournament match is BYE (only 1 participant)", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF2");
		const participant1Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF3",
		);

		const tournamentMatch = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
		]);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(tournamentMatch);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: tournamentMatch.id.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"試合には2人の参加者が必要です",
		);
	});

	it("should throw BadRequestError if tournament is not in progress", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF2");
		const participant1Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF3",
		);
		const participant2Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF4",
		);

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		}); // registration status
		const tournamentMatch = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(tournamentMatch);
		mockTournamentRepo.findById.mockResolvedValue(tournament);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: tournamentMatch.id.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"進行中のトーナメントの試合のみ開始できます",
		);
	});

	it("should throw BadRequestError if participants are not found", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF2");
		const participant1Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF3",
		);
		const participant2Id = new TournamentParticipantId(
			"01JAJCJCK5XPWQ9A7DRTBHVXF4",
		);

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		}).start();
		const tournamentMatch = TournamentMatch.create(tournamentId, roundId, [
			participant1Id,
			participant2Id,
		]);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findMatchById.mockResolvedValue(tournamentMatch);
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantById.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentMatchUsecase(mockTx);
		const input = {
			tournamentMatchId: tournamentMatch.id.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"参加者情報が見つかりません",
		);
	});
});
