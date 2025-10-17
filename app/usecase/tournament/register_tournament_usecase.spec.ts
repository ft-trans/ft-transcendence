import { ErrBadRequest } from "@domain/error";
import {
	MaxParticipants,
	Tournament,
	TournamentId,
	TournamentParticipant,
	UserId,
} from "@domain/model";
import type { ITournamentRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { RegisterTournamentUsecase } from "./register_tournament_usecase";

describe("RegisterTournamentUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should register a user to a tournament successfully", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const userId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
			maxParticipants: new MaxParticipants(4),
		});

		const expectedParticipant = TournamentParticipant.create(
			tournamentId,
			userId,
		);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantByTournamentAndUserId.mockResolvedValue(
			undefined,
		);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue([]);
		mockTournamentRepo.createParticipant.mockResolvedValue(expectedParticipant);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: userId.value,
		};
		const participant = await usecase.execute(input);

		expect(participant.tournamentId.equals(tournamentId)).toBe(true);
		expect(participant.userId.equals(userId)).toBe(true);
		expect(participant.status.value).toBe("active");
		expect(mockTournamentRepo.createParticipant).toHaveBeenCalledTimes(1);
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

		const usecase = new RegisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: "01JAJCJCK5XPWQ9A7DRTBHVXF0",
			userId: "01JAJCJCK5XPWQ9A7DRTBHVXF1",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントが見つかりません",
		);
	});

	it("should throw BadRequestError if tournament is not accepting registration", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
		});
		const startedTournament = tournament.start();

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(startedTournament);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: "01JAJCJCK5XPWQ9A7DRTBHVXF1",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"このトーナメントは現在参加登録を受け付けていません",
		);
	});

	it("should throw BadRequestError if user is already registered", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const userId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
		});

		const existingParticipant = TournamentParticipant.create(
			tournamentId,
			userId,
		);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantByTournamentAndUserId.mockResolvedValue(
			existingParticipant,
		);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: userId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"既にこのトーナメントに参加しています",
		);
	});

	it("should throw BadRequestError if tournament is full", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const userId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
			maxParticipants: new MaxParticipants(2), // 最大2人
		});

		// 既に2人の参加者がいる
		const existingParticipants = [
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			),
			TournamentParticipant.create(
				tournamentId,
				new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
			),
		];

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantByTournamentAndUserId.mockResolvedValue(
			undefined,
		);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			existingParticipants,
		);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new RegisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: userId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"このトーナメントは定員に達しています",
		);
	});
});
