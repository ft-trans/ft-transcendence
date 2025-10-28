import { Tournament, TournamentName, UserId } from "@domain/model";
import type { ITournamentRepository } from "@domain/repository";
import { createMockRepository } from "@usecase/test_helper";
import type { ITransaction } from "@usecase/transaction";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { CreateTournamentUsecase } from "./create_tournament_usecase";

describe("CreateTournamentUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should create a new tournament with fixed 5 participants", async () => {
		const organizerId = new UserId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
		const name = new TournamentName("Test Tournament");
		const expectedTournament = Tournament.create({
			name,
			organizerId,
		});

		const mockTournamentRepo = mock<ITournamentRepository>();
		mockTournamentRepo.create.mockResolvedValue(expectedTournament);

		const mockTx = mock<ITransaction>();
		mockTx.exec.mockImplementation(async (callback) => {
			const repo = createMockRepository({
				newTournamentRepository: () => mockTournamentRepo,
			});
			return callback(repo);
		});

		const usecase = new CreateTournamentUsecase(mockTx);
		const input = {
			name: "Test Tournament",
			organizerId: organizerId.value,
		};
		const tournament = await usecase.execute(input);

		expect(tournament.name.value).toBe("Test Tournament");
		expect(tournament.organizerId.equals(organizerId)).toBe(true);
		expect(tournament.status.value).toBe("registration");
		expect(tournament.maxParticipants.value).toBe(5);
		expect(mockTournamentRepo.create).toHaveBeenCalledTimes(1);
	});
});
