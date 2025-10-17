import { ErrBadRequest } from "@domain/error";
import {
	RoundNumber,
	Tournament,
	TournamentId,
	TournamentParticipant,
	TournamentRound,
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
import { StartTournamentUsecase } from "./start_tournament_usecase";

describe("StartTournamentUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should start a tournament with even number of participants", async () => {
		const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

		const tournament = Tournament.create({
			organizerId,
		});

		const user2 = User.create(
			new UserEmail("user2@example.com"),
			new Username("User2"),
		);
		const user3 = User.create(
			new UserEmail("user3@example.com"),
			new Username("User3"),
		);
		const user4 = User.create(
			new UserEmail("user4@example.com"),
			new Username("User4"),
		);
		const user5 = User.create(
			new UserEmail("user5@example.com"),
			new Username("User5"),
		);

		const participants = [
			TournamentParticipant.create(tournamentId, user2.id),
			TournamentParticipant.create(tournamentId, user3.id),
			TournamentParticipant.create(tournamentId, user4.id),
			TournamentParticipant.create(tournamentId, user5.id),
		];

		const firstRound = TournamentRound.create(tournamentId, new RoundNumber(1));

		const mockTournamentRepo = mock<ITournamentRepository>();
		const mockMatchRepo = mock<IMatchRepository>();
		const mockUserRepo = mock<IUserRepository>();

		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);
		mockTournamentRepo.findParticipantById.mockImplementation(async (pid) => {
			return participants.find((p) => p.id.equals(pid));
		});
		mockTournamentRepo.update.mockImplementation(async (t) => t);
		mockTournamentRepo.createRound.mockResolvedValue(firstRound);
		mockTournamentRepo.createMatch.mockImplementation(async (match) => match);

		mockUserRepo.findById.mockImplementation(async (userId) => {
			if (userId.equals(user2.id)) return user2;
			if (userId.equals(user3.id)) return user3;
			if (userId.equals(user4.id)) return user4;
			if (userId.equals(user5.id)) return user5;
			return undefined;
		});

		mockMatchRepo.save.mockImplementation(async (match) => match);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
				newMatchRepository: () => mockMatchRepo,
				newUserRepository: () => mockUserRepo,
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
			organizerId,
		});

		const user2 = User.create(
			new UserEmail("user2@example.com"),
			new Username("User2"),
		);
		const user3 = User.create(
			new UserEmail("user3@example.com"),
			new Username("User3"),
		);
		const user4 = User.create(
			new UserEmail("user4@example.com"),
			new Username("User4"),
		);

		const participants = [
			TournamentParticipant.create(tournamentId, user2.id),
			TournamentParticipant.create(tournamentId, user3.id),
			TournamentParticipant.create(tournamentId, user4.id),
		];

		const firstRound = TournamentRound.create(tournamentId, new RoundNumber(1));

		const mockTournamentRepo = mock<ITournamentRepository>();
		const mockMatchRepo = mock<IMatchRepository>();
		const mockUserRepo = mock<IUserRepository>();

		mockTournamentRepo.findById.mockResolvedValue(tournament);
		mockTournamentRepo.findParticipantsByTournamentId.mockResolvedValue(
			participants,
		);
		mockTournamentRepo.findParticipantById.mockImplementation(async (pid) => {
			return participants.find((p) => p.id.equals(pid));
		});
		mockTournamentRepo.update.mockImplementation(async (t) => t);
		mockTournamentRepo.createRound.mockResolvedValue(firstRound);
		mockTournamentRepo.createMatch.mockImplementation(async (match) => match);

		mockUserRepo.findById.mockImplementation(async (userId) => {
			if (userId.equals(user2.id)) return user2;
			if (userId.equals(user3.id)) return user3;
			if (userId.equals(user4.id)) return user4;
			return undefined;
		});

		mockMatchRepo.save.mockImplementation(async (match) => match);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
				newMatchRepository: () => mockMatchRepo,
				newUserRepository: () => mockUserRepo,
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
