import { Ball } from "@domain/model";
import type { IBallRepository, IKVSRepository } from "@domain/repository";
import { PongField } from "@shared/api/pong";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { CalcPongStateUsecase } from "./calc_pong_state_usecase";

describe("CalcPongStateUsecase", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should calculate the current state of the pong game", async () => {
		const ball = new Ball(1, 2, 3, 4);
		const newBall = new Ball(4, 6, 3, 4);
		const mockBallRepo = mock<IBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.vx).toEqual(newBall.vx);
		expect(state.ball.vy).toEqual(newBall.vy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (x = 0)", async () => {
		const ball = new Ball(0, 2, -3, 4);
		const newBall = new Ball(3, 6, 3, 4);
		const mockBallRepo = mock<IBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.vx).toEqual(newBall.vx);
		expect(state.ball.vy).toEqual(newBall.vy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (x = width)", async () => {
		const ball = new Ball(PongField.width, 2, 3, 4);
		const newBall = new Ball(PongField.width - 3, 6, -3, 4);
		const mockBallRepo = mock<IBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.vx).toEqual(newBall.vx);
		expect(state.ball.vy).toEqual(newBall.vy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (y = 0)", async () => {
		const ball = new Ball(1, 0, 3, -4);
		const newBall = new Ball(4, 4, 3, 4);
		const mockBallRepo = mock<IBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.vx).toEqual(newBall.vx);
		expect(state.ball.vy).toEqual(newBall.vy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (y = height)", async () => {
		const ball = new Ball(1, PongField.height, 3, 4);
		const newBall = new Ball(4, PongField.height - 4, 3, -4);
		const mockBallRepo = mock<IBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.vx).toEqual(newBall.vx);
		expect(state.ball.vy).toEqual(newBall.vy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});
});
