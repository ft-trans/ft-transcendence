import type { MatchId, PongPlayer, User } from "@domain/model";
import type { IRepository } from "@domain/repository";

export class GetMatchPlayersUseCase {
	constructor(private readonly repo: IRepository) {}

	async execute(
		matchId: MatchId,
		player: PongPlayer,
	): Promise<User | undefined> {
		const pongMatchStateRepository = this.repo.newPongMatchStateRepository();
		const state = pongMatchStateRepository.get(matchId);
		if (!state) {
			return undefined;
		}
		const userRepository = this.repo.newUserRepository();
		return await userRepository.findById(state.playerIds[player]);
	}
}
