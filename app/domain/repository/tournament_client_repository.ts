import type { TournamentId, UserId } from "@domain/model";
import type { ITournamentClient } from "@domain/service/tournament_client";
import type { TournamentServerMessage } from "@shared/api/tournament";

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

	/**
	 * トーナメントに参加している全クライアントにメッセージをブロードキャスト
	 */
	broadcastToTournament(
		tournamentId: TournamentId,
		message: TournamentServerMessage,
	): void;
}
