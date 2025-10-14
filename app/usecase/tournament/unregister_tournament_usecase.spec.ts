import { ErrBadRequest } from "@domain/error";
import {
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
import { UnregisterTournamentUsecase } from "./unregister_tournament_usecase";

describe("UnregisterTournamentUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should unregister a user from a tournament successfully", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const userId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
		});

		const participant = TournamentParticipant.create(tournamentId, userId);

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantByTournamentAndUserId.mockResolvedValue(
			participant,
		);
		mockTournamentRepo.deleteParticipant.mockResolvedValue(participant);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new UnregisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: userId.value,
		};
		const deletedParticipant = await usecase.execute(input);

		expect(deletedParticipant.tournamentId.equals(tournamentId)).toBe(true);
		expect(deletedParticipant.userId.equals(userId)).toBe(true);
		expect(mockTournamentRepo.deleteParticipant).toHaveBeenCalledTimes(1);
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

		const usecase = new UnregisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: "01JAJCJCK5XPWQ9A7DRTBHVXF0",
			userId: "01JAJCJCK5XPWQ9A7DRTBHVXF1",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"トーナメントが見つかりません",
		);
	});

	it("should throw BadRequestError if tournament has already started", async () => {
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

		const usecase = new UnregisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: "01JAJCJCK5XPWQ9A7DRTBHVXF1",
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"開始後のトーナメントからは退出できません",
		);
	});

	it("should throw BadRequestError if user is not registered", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const userId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF2");

		const tournament = Tournament.create({
			organizerId,
		});

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantByTournamentAndUserId.mockResolvedValue(
			undefined,
		);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new UnregisterTournamentUsecase(mockTx);
		const input = {
			tournamentId: tournamentId.value,
			userId: userId.value,
		};

		await expect(usecase.execute(input)).rejects.toThrow(ErrBadRequest);
		await expect(usecase.execute(input)).rejects.toThrow(
			"このトーナメントに参加していません",
		);
	});
});
