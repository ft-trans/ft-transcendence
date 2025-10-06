import {
	Match,
	MatchId,
	type PongLoopId,
	User,
	UserEmail,
	Username,
} from "@domain/model";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongMatchStateRepository,
	IPongPaddleRepository,
	ISessionRepository,
	IUserPresenceRepository,
	IUserRepository,
} from "@domain/repository";
import type { IPongClient } from "@domain/service/pong_client";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { JoinPongUsecase } from "./join_pong_usecase";

const pongClientRepo = mock<IPongClientRepository>();
const pongLoopRepo = mock<IPongLoopRepository>();
const matchmakingRepo = mock<IMatchRepository>();

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
	newUserPresenceRepository: () => mock<IUserPresenceRepository>(),
	newPongClientRepository: () => pongClientRepo,
	newPongLoopRepository: () => pongLoopRepo,
	newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
	newMatchRepository: () => matchmakingRepo,
};

describe("JoinPongUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should join a user to a match and return the match ID", async () => {
		const player1 = User.create(
			new UserEmail("player1@example.com"),
			new Username("player1"),
		);
		const player2 = User.create(
			new UserEmail("player2@example.com"),
			new Username("player2"),
		);
		const match = Match.create([player1, player2]);
		const matchId = match.id;
		matchmakingRepo.findById.mockResolvedValue(match);
		const pongClient = mock<IPongClient>();
		pongLoopRepo.get.mockReturnValue(undefined);

		const usecase = new JoinPongUsecase(repo);
		const input = {
			matchId: matchId,
			client: pongClient,
			userId: player1.id.value,
		};
		const ret = await usecase.execute(input);

		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().add).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().add).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().set).toHaveBeenCalledOnce();
	});

	it("should not create a new loop if one already exists with the same matchId", async () => {
		const matchId = ulid();
		const pongClient = mock<IPongClient>();
		const pongLoopId = mock<PongLoopId>();
		pongLoopRepo.get.mockReturnValue(pongLoopId);

		const usecase = new JoinPongUsecase(repo);
		const input = { matchId: matchId, client: pongClient, userId: undefined };
		const ret = await usecase.execute(input);

		expect(ret.value).toBe(matchId);

		expect(repo.newPongClientRepository().add).toHaveBeenCalledOnce();
		expect(repo.newPongClientRepository().add).toHaveBeenCalledWith(
			new MatchId(matchId),
			pongClient,
		);

		expect(repo.newPongLoopRepository().get).toHaveBeenCalledOnce();
		expect(repo.newPongLoopRepository().set).not.toHaveBeenCalled();
	});
});
