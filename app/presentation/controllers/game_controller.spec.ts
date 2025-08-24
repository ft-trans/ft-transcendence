import type { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { gameController } from "./game_controller";

const joinMatchmakingUsecase = mock<JoinMatchmakingUseCase>();

const fastify = Fastify();
fastify.register(gameController(joinMatchmakingUsecase));

describe("gameController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("POST /game/matchmaking/join", () => {
		it("should return 200", async () => {
			const response = await fastify.inject({
				method: "POST",
				url: "/game/matchmaking/join",
				payload: {},
			});

			expect(response.statusCode).toBe(200);
			expect(joinMatchmakingUsecase.execute).toHaveBeenCalledOnce();
		});
	});
});
