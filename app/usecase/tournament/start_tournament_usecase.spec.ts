import { ErrBadRequest } from "@domain/error";
import {
	RoundNumber,
	Tournament,
	TournamentId,
	TournamentName,
	TournamentParticipant,
	TournamentRound,
	UserId,
} from "@domain/model";
import type { ITournamentRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { StartTournamentUsecase } from "./start_tournament_usecase";

describe("StartTournamentUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should start a tournament with even number of participants", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		});

		const participants = [
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF5"),
			),
		];

		const firstRound = TournamentRound.create(tournamentId, new RoundNumber(1));

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);
		mockTournamentRepo.update.mockImplementation(async (t) => t);
		mockTournamentRepo.createRound.mockResolvedValue(firstRound);
		mockTournamentRepo.createMatch.mockImplementation(async (match) => match);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			organizerId: organizerId.value,
		};
		const result = await usecase.execute(input);

		expect(result.tournament.status.value).toBe("in_progress");
		expect(result.firstRound.roundNumber.value).toBe(1);
		expect(result.matches.length).toBe(2);
		expect(mockTournamentRepo.update).toHaveBeenCalledTimes(1);
		expect(mockTournamentRepo.createRound).toHaveBeenCalledTimes(1);
		expect(mockTournamentRepo.createMatch).toHaveBeenCalledTimes(2);
	});

	it("should start a tournament with odd number of participants (with BYE)", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		});

		const participants = [
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
			),
		];

		const firstRound = TournamentRound.create(tournamentId, new RoundNumber(1));

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);
		mockTournamentRepo.update.mockImplementation(async (t) => t);
		mockTournamentRepo.createRound.mockResolvedValue(firstRound);
		mockTournamentRepo.createMatch.mockImplementation(async (match) => match);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			organizerId: organizerId.value,
		};
		const result = await usecase.execute(input);

		expect(result.tournament.status.value).toBe("in_progress");
		expect(result.matches.length).toBe(2);
		expect(result.matches.some((m) => m.isBye())).toBe(true);
		expect(mockTournamentRepo.createMatch).toHaveBeenCalledTimes(2);
	});

	it("should throw BadRequestError if tournament does not exist", async () => {
		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(undefined);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: "01JAJCJCK5XPWQ9A7DRTBHVXF0",
			organizerId: "01JAJCJCK5XPWQ9A7DRTBHVXF1",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントが見つかりません",
		);
	});

	it("should throw BadRequestError if user is not the organizer", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const otherUserId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		});

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			organizerId: otherUserId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントを開始できるのは主催者のみです",
		);
	});

	it("should throw BadRequestError if tournament has less than 2 participants", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		});

		const participants = [
			TournamentParticipant.create(tournamentId, organizerId),
		];

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			organizerId: organizerId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントを開始するには最低2人の参加者が必要です",
		);
	});

	it("should throw BadRequestError if tournament has already started", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

		const tournament = Tournament.create({
			name: new TournamentName("Test Tournament"),
			organizerId,
		});
		const startedTournament = tournament.start();

		const participants = [
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			),
		];

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(startedTournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new StartTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			organizerId: organizerId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントを開始するには最低2人の参加者が必要です",
		);
	});
});
