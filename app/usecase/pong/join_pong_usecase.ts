import { ErrInternalServer, ErrNotFound } from "@domain/error";
import { MatchId, PongMatchState, PongPaddle, UserId } from "@domain/model";
import type { IRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";
import type { IPongClient } from "@domain/service/pong_client";
import { PongGameEngineService } from "@domain/service/pong_game_engine_service";

export type JoinPongUsecaseInput = {
	matchId: string;
	client: IPongClient;
	userId: string | undefined;
};

export class JoinPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: JoinPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		this.repo.newPongClientRepository().add(matchId, input.client);
		await this.setPaddle(matchId);
		await this.setPongMatchState(matchId, input.userId);
		this.startLoop(matchId);
		return matchId;
	}

	private async setPaddle(matchId: MatchId): Promise<void> {
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const paddle1 = await pongPaddleRepo.get(matchId, "player1");
		if (!paddle1) {
			await pongPaddleRepo.set(
				matchId,
				"player1",
				PongPaddle.createInitial("player1"),
			);
		}
		const paddle2 = await pongPaddleRepo.get(matchId, "player2");
		if (!paddle2) {
			await pongPaddleRepo.set(
				matchId,
				"player2",
				PongPaddle.createInitial("player2"),
			);
		}
	}

	private async setPongMatchState(
		matchId: MatchId,
		userIdStr: string | undefined,
	): Promise<void> {
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		let state = pongMatchStateRepo.get(matchId);
		if (!state) {
			state = await this.initPongMatchState(matchId);
		}
		if (!userIdStr) {
			return;
		}
		const userId = new UserId(userIdStr);
		if (state.playerIds.player1.equals(userId)) {
			const newState = state.updatePlayerState("player1", "playing");
			pongMatchStateRepo.set(matchId, newState);
		} else if (state.playerIds.player2.equals(userId)) {
			const newState = state.updatePlayerState("player2", "playing");
			pongMatchStateRepo.set(matchId, newState);
		}
	}

	private async initPongMatchState(matchId: MatchId): Promise<PongMatchState> {
		const matchRepo = this.repo.newMatchRepository();
		const match = await matchRepo.findById(matchId.value);
		if (!match) {
			throw new ErrNotFound();
		}
		if (match.participants.length < 2) {
			throw new ErrInternalServer({
				systemMessage: "Not enough participants",
			});
		}
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const newState = PongMatchState.init({
			player1: match.participants[0].id,
			player2: match.participants[1].id,
		});

		pongMatchStateRepo.set(matchId, newState);
		return newState;
	}

	private startLoop(matchId: MatchId): void {
		const pongLoopRepo = this.repo.newPongLoopRepository();
		const pongLoopService = new PongLoopService(pongLoopRepo);
		if (pongLoopService.exists(matchId)) {
			return;
		}

		const pongBallRepo = this.repo.newPongBallRepository();
		const pongPaddleRepo = this.repo.newPongPaddleRepository();
		const pongClientRepo = this.repo.newPongClientRepository();
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongPaddleRepo,
			pongClientRepo,
			pongMatchStateRepo,
		);
		pongLoopService.start(matchId, () => pongGameEngineService.processFrame());
	}
}
