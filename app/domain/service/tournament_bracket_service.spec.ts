import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	TournamentId,
	TournamentParticipantId,
	TournamentRoundId,
} from "../model";
import { TournamentBracketService } from "./tournament_bracket_service";

describe("TournamentBracketService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("generateFirstRoundMatches", () => {
		it("should generate matches for even number of participants", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const participantIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF5"),
			];

			const noShuffle = <T>(array: T[]): T[] => array;
			const service = new TournamentBracketService(noShuffle);

			const matches = service.generateFirstRoundMatches(
				tournamentId,
				roundId,
				participantIds,
			);

			expect(matches.length).toBe(2);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[1].participantIds.length).toBe(2);
			expect(matches[0].isBye()).toBe(false);
			expect(matches[1].isBye()).toBe(false);
		});

		it("should generate matches for odd number of participants with BYE", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const participantIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
			];

			const noShuffle = <T>(array: T[]): T[] => array;
			const service = new TournamentBracketService(noShuffle);

			const matches = service.generateFirstRoundMatches(
				tournamentId,
				roundId,
				participantIds,
			);

			expect(matches.length).toBe(2);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[1].participantIds.length).toBe(1);
			expect(matches[0].isBye()).toBe(false);
			expect(matches[1].isBye()).toBe(true);
		});

		it("should generate matches for 2 participants", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const participantIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			];

			const noShuffle = <T>(array: T[]): T[] => array;
			const service = new TournamentBracketService(noShuffle);

			const matches = service.generateFirstRoundMatches(
				tournamentId,
				roundId,
				participantIds,
			);

			expect(matches.length).toBe(1);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[0].isBye()).toBe(false);
		});

		it("should shuffle participants by default", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const participantIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF5"),
			];

			const service = new TournamentBracketService();

			const matches = service.generateFirstRoundMatches(
				tournamentId,
				roundId,
				participantIds,
			);

			expect(matches.length).toBe(2);
			const allParticipantIds = matches.flatMap((m) => m.participantIds);
			expect(allParticipantIds.length).toBe(4);
		});
	});

	describe("calculateNextRoundMatchCount", () => {
		it("should calculate next round match count correctly", () => {
			const service = new TournamentBracketService();

			expect(service.calculateNextRoundMatchCount(4)).toBe(2);
			expect(service.calculateNextRoundMatchCount(3)).toBe(2);
			expect(service.calculateNextRoundMatchCount(2)).toBe(1);
			expect(service.calculateNextRoundMatchCount(1)).toBe(1);
		});
	});

	describe("generateNextRoundMatches", () => {
		it("should generate next round matches from winners", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const winnerIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
			];

			const service = new TournamentBracketService();

			const matches = service.generateNextRoundMatches(
				tournamentId,
				roundId,
				winnerIds,
			);

			expect(matches.length).toBe(1);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[0].isBye()).toBe(false);
		});

		it("should handle odd number of winners with BYE", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const winnerIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
			];

			const service = new TournamentBracketService();

			const matches = service.generateNextRoundMatches(
				tournamentId,
				roundId,
				winnerIds,
			);

			expect(matches.length).toBe(2);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[1].participantIds.length).toBe(1);
			expect(matches[1].isBye()).toBe(true);
		});

		it("should handle 4 winners", () => {
			const tournamentId = new TournamentId("01JAJCJCK5XPWQ9A7DRTBHVXF0");
			const roundId = new TournamentRoundId("01JAJCJCK5XPWQ9A7DRTBHVXF1");

			const winnerIds = [
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF2"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF3"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF4"),
				new TournamentParticipantId("01JAJCJCK5XPWQ9A7DRTBHVXF5"),
			];

			const service = new TournamentBracketService();

			const matches = service.generateNextRoundMatches(
				tournamentId,
				roundId,
				winnerIds,
			);

			expect(matches.length).toBe(2);
			expect(matches[0].participantIds.length).toBe(2);
			expect(matches[1].participantIds.length).toBe(2);
		});
	});
});
