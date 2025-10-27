/**
 * トーナメント関連のAPI型定義
 */

// トーナメントステータス
export type TournamentStatus =
	| "registration"
	| "in_progress"
	| "completed"
	| "cancelled";

// トーナメント参加者ステータス
export type TournamentParticipantStatus = "active" | "eliminated" | "withdrawn";

// トーナメントラウンドステータス
export type TournamentRoundStatus = "pending" | "in_progress" | "completed";

// トーナメント試合ステータス
export type TournamentMatchStatus = "pending" | "in_progress" | "completed";

/**
 * ユーザー情報（簡略版）
 */
export type UserInfo = {
	id: string;
	username: string;
	avatar: string;
};

/**
 * トーナメント参加者
 */
export type TournamentParticipantDTO = {
	id: string;
	tournamentId: string;
	userId: string;
	user: UserInfo;
	status: TournamentParticipantStatus;
};

/**
 * トーナメント試合
 */
export type TournamentMatchDTO = {
	id: string;
	tournamentId: string;
	roundId: string;
	matchId?: string; // 既存のMatchテーブルとの関連（試合開始後に設定）
	participants: TournamentParticipantDTO[];
	winnerId?: string; // TournamentParticipantId
	status: TournamentMatchStatus;
	completedAt?: string;
	createdAt: string;
};

/**
 * トーナメントラウンド
 */
export type TournamentRoundDTO = {
	id: string;
	tournamentId: string;
	roundNumber: number;
	status: TournamentRoundStatus;
	matches: TournamentMatchDTO[];
	createdAt: string;
};

/**
 * トーナメント（基本情報）
 */
export type TournamentDTO = {
	id: string;
	name: string;
	description?: string;
	organizerId: string;
	organizer: UserInfo;
	status: TournamentStatus;
	maxParticipants: number;
	participantCount: number; // 参加者数
	createdAt: string;
	updatedAt: string;
};

/**
 * トーナメント（詳細情報）
 */
export type TournamentDetailDTO = TournamentDTO & {
	participants: TournamentParticipantDTO[];
	rounds: TournamentRoundDTO[];
};

/**
 * トーナメント作成リクエスト
 */
export type CreateTournamentRequest = {
	name: string;
	description?: string;
	maxParticipants?: number; // デフォルト: 8
};

/**
 * トーナメント作成レスポンス
 */
export type CreateTournamentResponse = TournamentDTO;

/**
 * トーナメント一覧取得リクエスト（クエリパラメータ）
 */
export type GetTournamentsQuery = {
	status?: TournamentStatus;
	limit?: number;
	offset?: number;
};

/**
 * トーナメント一覧取得レスポンス
 */
export type GetTournamentsResponse = {
	tournaments: TournamentDTO[];
	total: number;
};

/**
 * トーナメント参加登録レスポンス
 */
export type RegisterTournamentResponse = {
	participant: TournamentParticipantDTO;
};

/**
 * トーナメント試合開始レスポンス
 */
export type StartTournamentMatchResponse = {
	matchId: string; // 作成されたMatchのID（クライアントはこれで/pong/matches/:match_idに接続）
};

/**
 * トーナメント試合完了リクエスト
 */
export type CompleteTournamentMatchRequest = {
	winnerId: string; // TournamentParticipantId
};

/**
 * トーナメント試合完了レスポンス
 */
export type CompleteTournamentMatchResponse = {
	match: TournamentMatchDTO;
	isRoundCompleted: boolean;
	isTournamentCompleted: boolean;
	nextRound?: TournamentRoundDTO;
	tournament?: TournamentDTO;
};
