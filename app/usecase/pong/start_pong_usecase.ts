import { ErrBadRequest, ErrInternalServer, ErrNotFound } from "@domain/error";
import { MatchId, PongMatchState } from "@domain/model";
import type { IRepository } from "@domain/repository";
import { PongLoopService } from "@domain/service";

import { PongGameEngineService } from "@domain/service/pong_game_engine_service";

export type StartPongUsecaseInput = {
	matchId: string;
};

export class StartPongUsecase {
	constructor(private readonly repo: IRepository) {}

	async execute(input: StartPongUsecaseInput): Promise<MatchId> {
		const matchId = new MatchId(input.matchId);
		await this.initPongMatchState(matchId);
		this.startLoop(matchId);
		return matchId;
	}

	private async initPongMatchState(matchId: MatchId): Promise<PongMatchState> {
		const pongMatchStateRepo = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepo.get(matchId);
		if (state) {
			return state;
		}
		const matchRepo = this.repo.newMatchRepository();
		const match = await matchRepo.findById(matchId.value);
		if (!match) {
			throw new ErrNotFound();
		}
		if (match.status === "completed") {
			throw new ErrBadRequest({
				details: { match: "対戦はすでに終了しています。" },
			});
		}
		if (match.participants.length < 2) {
			throw new ErrInternalServer({
				systemMessage: "参加者が足りません。",
			});
		}
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
		const matchRepo = this.repo.newMatchRepository();
		const matchHistoryRepo = this.repo.newMatchHistoryRepository();
		const tournamentRepo = this.repo.newTournamentRepository();
		const tournamentClientRepo = this.repo.newTournamentClientRepository();
		const pongGameEngineService = new PongGameEngineService(
			matchId,
			pongBallRepo,
			pongPaddleRepo,
			pongClientRepo,
			pongMatchStateRepo,
			matchRepo,
			pongLoopService,
			matchHistoryRepo,
			tournamentRepo,
			tournamentClientRepo,
		);
		pongLoopService.start(matchId, () => pongGameEngineService.processFrame());
	}
}
