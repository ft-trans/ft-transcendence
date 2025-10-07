import {
	PongMatchState,
	PongPaddle,
	pongPaddleDy,
	UserId,
} from "@domain/model";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IMatchHistoryRepository,
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
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
	UpdatePongPaddleUsecase,
	type UpdatePongPaddleUsecaseInput,
} from "./update_pong_paddle_usecase";

const pongPaddleRepo = mock<IPongPaddleRepository>();
const pongMatchStateRepo = mock<IPongMatchStateRepository>();

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => pongPaddleRepo,
	newUserPresenceRepository: () => mock<IUserPresenceRepository>(),
	newPongClientRepository: () => mock<IPongClientRepository>(),
	newPongLoopRepository: () => mock<IPongLoopRepository>(),
	newPongMatchStateRepository: () => pongMatchStateRepo,
	newMatchRepository: () => mock<IMatchRepository>(),
	newMatchHistoryRepository: () => mock<IMatchHistoryRepository>(),
};

describe("UpdatePongPaddleUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should update paddle position", async () => {
		const matchId = ulid();
		const paddle = new PongPaddle({ x: 10, y: 100 });
		pongPaddleRepo.get.mockResolvedValue(paddle);
		const player1Id = new UserId(ulid());
		const player2Id = new UserId(ulid());
		const state = PongMatchState.init({
			player1: player1Id,
			player2: player2Id,
		});
		pongMatchStateRepo.get.mockReturnValue(state);

		const usecase = new UpdatePongPaddleUsecase(repo);
		const input = {
			matchId: matchId,
			player: "player1",
			direction: "up",
			userId: player1Id.value,
		} as UpdatePongPaddleUsecaseInput;
		const ret = await usecase.execute(input);

		expect(pongPaddleRepo.set).toHaveBeenCalledOnce();
		expect(ret.y).toBe(paddle.y - pongPaddleDy);
		expect(ret.x).toBe(paddle.x);
	});

	it("should return undefined if paddle not found", async () => {
		const matchId = ulid();
		pongPaddleRepo.get.mockResolvedValue(undefined);
		const player1Id = new UserId(ulid());
		const player2Id = new UserId(ulid());
		const state = PongMatchState.init({
			player1: player1Id,
			player2: player2Id,
		});
		pongMatchStateRepo.get.mockReturnValue(state);

		const usecase = new UpdatePongPaddleUsecase(repo);
		const input = {
			matchId: matchId,
			player: "player1",
			direction: "up",
			userId: player1Id.value,
		} as UpdatePongPaddleUsecaseInput;
		const ret = await usecase.execute(input);
		expect(ret).toBeUndefined();
		expect(pongPaddleRepo.set).not.toHaveBeenCalled();
	});
});
