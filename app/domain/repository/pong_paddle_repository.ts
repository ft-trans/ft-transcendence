import type { MatchId, PongPaddle, PongPlayer } from "../model";

export interface IPongPaddleRepository {
	set(
		matchId: MatchId,
		player: PongPlayer,
		paddle: PongPaddle,
	): Promise<PongPaddle>;
	get(matchId: MatchId, player: PongPlayer): Promise<PongPaddle | undefined>;
	delete(matchId: MatchId, player: PongPlayer): Promise<void>;
}
