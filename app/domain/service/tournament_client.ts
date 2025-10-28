import type { TournamentId } from "@domain/model";
import type { TournamentServerMessage } from "@shared/api/tournament";

/**
 * トーナメント用WebSocketクライアント
 */
export interface ITournamentClient {
	/**
	 * クライアントに接続されているユーザーIDを取得
	 */
	getUserId(): string | undefined;

	/**
	 * クライアントが購読しているトーナメントIDのセットを取得
	 */
	getTournamentIds(): Set<string>;

	/**
	 * トーナメントを購読
	 */
	subscribeTournament(tournamentId: TournamentId): void;

	/**
	 * トーナメントの購読を解除
	 */
	unsubscribeTournament(tournamentId: TournamentId): void;

	/**
	 * メッセージを送信
	 */
	send(message: TournamentServerMessage): void;

	/**
	 * 接続を閉じる
	 */
	close(): void;
}
