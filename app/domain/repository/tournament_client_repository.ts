import type { TournamentId, UserId } from "@domain/model";
import type { ITournamentClient } from "@domain/service/tournament_client";

/**
 * トーナメント用WebSocketクライアントリポジトリ
 */
export interface ITournamentClientRepository {
	/**
	 * クライアントを追加
	 */
	add(client: ITournamentClient): void;

	/**
	 * クライアントを削除
	 */
	remove(client: ITournamentClient): void;

	/**
	 * ユーザーIDでクライアントを取得
	 */
	findByUserId(userId: UserId): ITournamentClient | undefined;

	/**
	 * トーナメントIDに参加している全クライアントを取得
	 */
	findByTournamentId(tournamentId: TournamentId): ITournamentClient[];

	/**
	 * 全クライアントを取得
	 */
	findAll(): ITournamentClient[];
}
