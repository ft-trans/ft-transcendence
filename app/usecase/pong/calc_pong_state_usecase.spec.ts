import { PongBall } from "@domain/model";
import type { IKVSRepository, IPongBallRepository } from "@domain/repository";
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
		const ball = new PongBall({ x: 1, y: 2, dx: 3, dy: 4 });
		const newBall = new PongBall({ x: 4, y: 6, dx: 3, dy: 4 });
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.dx).toEqual(newBall.dx);
		expect(state.ball.dy).toEqual(newBall.dy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (x = 0)", async () => {
		const ball = new PongBall({ x: 0, y: 2, dx: -3, dy: 4 });
		const newBall = new PongBall({ x: 3, y: 6, dx: 3, dy: 4 });
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.dx).toEqual(newBall.dx);
		expect(state.ball.dy).toEqual(newBall.dy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (x = width)", async () => {
		const ball = new PongBall({ x: PongField.width, y: 2, dx: 3, dy: 4 });
		const newBall = new PongBall({
			x: PongField.width - 3,
			y: 6,
			dx: -3,
			dy: 4,
		});
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.dx).toEqual(newBall.dx);
		expect(state.ball.dy).toEqual(newBall.dy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (y = 0)", async () => {
		const ball = new PongBall({ x: 1, y: 0, dx: 3, dy: -4 });
		const newBall = new PongBall({ x: 4, y: 4, dx: 3, dy: 4 });
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.dx).toEqual(newBall.dx);
		expect(state.ball.dy).toEqual(newBall.dy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});

	it("should calculate bound (y = height)", async () => {
		const ball = new PongBall({ x: 1, y: PongField.height, dx: 3, dy: 4 });
		const newBall = new PongBall({
			x: 4,
			y: PongField.height - 4,
			dx: 3,
			dy: -4,
		});
		const mockBallRepo = mock<IPongBallRepository>();
		mockBallRepo.get.mockResolvedValue(ball);
		mockBallRepo.set.mockResolvedValue(newBall);
		const repo = mock<IKVSRepository>();
		repo.newPongBallRepository.mockReturnValue(mockBallRepo);

		const usecase = new CalcPongStateUsecase(repo);

		const matchId = ulid();

		const state = await usecase.execute({ matchId });

		expect(state.ball.x).toEqual(newBall.x);
		expect(state.ball.y).toEqual(newBall.y);
		expect(state.ball.dx).toEqual(newBall.dx);
		expect(state.ball.dy).toEqual(newBall.dy);
		expect(mockBallRepo.get).toHaveBeenCalledOnce();
		expect(mockBallRepo.set).toHaveBeenCalledOnce();
	});
});
