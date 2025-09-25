import { PongPaddle, pongPaddleDy } from "@domain/model/pong";
import type {
	IDirectMessageRepository,
	IFriendshipRepository,
	IPongBallRepository,
	IPongClientRepository,
	IPongLoopRepository,
	IPongPaddleRepository,
	ISessionRepository,
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

const repo = {
	newUserRepository: () => mock<IUserRepository>(),
	newFriendshipRepository: () => mock<IFriendshipRepository>(),
	newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
	newPongBallRepository: () => mock<IPongBallRepository>(),
	newPongPaddleRepository: () => pongPaddleRepo,
	newPongClientRepository: () => mock<IPongClientRepository>(),
	newPongLoopRepository: () => mock<IPongLoopRepository>(),
	newSessionRepository: () => mock<ISessionRepository>(),
};

describe("UpdatePongPaddleUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should update paddle position", async () => {
		const matchId = ulid();
		const paddle = new PongPaddle({ x: 10, y: 100 });
		pongPaddleRepo.get.mockResolvedValue(paddle);

		const usecase = new UpdatePongPaddleUsecase(repo);
		const input = {
			matchId: matchId,
			player: "player1",
			direction: "up",
		} as UpdatePongPaddleUsecaseInput;
		const ret = await usecase.execute(input);

		expect(pongPaddleRepo.set).toHaveBeenCalledOnce();
		expect(ret.y).toBe(paddle.y - pongPaddleDy);
		expect(ret.x).toBe(paddle.x);
	});

	it("should return undefined if paddle not found", async () => {
		const matchId = ulid();
		pongPaddleRepo.get.mockResolvedValue(undefined);

		const usecase = new UpdatePongPaddleUsecase(repo);
		const input = {
			matchId: matchId,
			player: "player1",
			direction: "up",
		} as UpdatePongPaddleUsecaseInput;
		const ret = await usecase.execute(input);
		expect(ret).toBeUndefined();
		expect(pongPaddleRepo.set).not.toHaveBeenCalled();
	});
});
