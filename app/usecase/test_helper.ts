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
	IRepository,
	ISessionRepository,
	ITournamentClientRepository,
	ITournamentRepository,
	IUserPresenceRepository,
	IUserRepository,
} from "@domain/repository";
import { mock } from "vitest-mock-extended";

/**
 * テスト用リポジトリモックを作成する
 *
 * 特定のリポジトリをカスタマイズしたい場合は、引数として渡す。
 * 指定されなかったリポジトリは自動的にモックが生成される。
 */
export function createMockRepository(
	overrides: Partial<IRepository> = {},
): IRepository {
	return {
		newUserRepository: () => mock<IUserRepository>(),
		newFriendshipRepository: () => mock<IFriendshipRepository>(),
		newDirectMessageRepository: () => mock<IDirectMessageRepository>(),
		newSessionRepository: () => mock<ISessionRepository>(),
		newPongBallRepository: () => mock<IPongBallRepository>(),
		newPongPaddleRepository: () => mock<IPongPaddleRepository>(),
		newUserPresenceRepository: () => mock<IUserPresenceRepository>(),
		newPongClientRepository: () => mock<IPongClientRepository>(),
		newPongLoopRepository: () => mock<IPongLoopRepository>(),
		newPongMatchStateRepository: () => mock<IPongMatchStateRepository>(),
		newMatchRepository: () => mock<IMatchRepository>(),
		newMatchHistoryRepository: () => mock<IMatchHistoryRepository>(),
		newTournamentRepository: () => mock<ITournamentRepository>(),
		newTournamentClientRepository: () => mock<ITournamentClientRepository>(),
		...overrides,
	};
}
