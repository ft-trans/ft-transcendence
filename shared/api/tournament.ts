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

// =============================================================================
// WebSocketイベント定義
// =============================================================================

/**
 * WebSocketイベントタイプ定数
 */
export const TOURNAMENT_WS_EVENTS = {
	// サーバー -> クライアント
	PARTICIPANT_JOINED: "tournament.participant_joined",
	TOURNAMENT_STARTED: "tournament.started",
	MATCH_STARTED: "tournament.match_started",
	MATCH_COMPLETED: "tournament.match_completed",
	ROUND_COMPLETED: "tournament.round_completed",
	TOURNAMENT_COMPLETED: "tournament.completed",
	ERROR: "tournament.error",
} as const;

/**
 * 参加者追加イベント
 */
export type ParticipantJoinedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.PARTICIPANT_JOINED;
	payload: {
		tournamentId: string;
		participant: TournamentParticipantDTO;
	};
};

/**
 * トーナメント開始イベント
 */
export type TournamentStartedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.TOURNAMENT_STARTED;
	payload: {
		tournamentId: string;
		tournament: TournamentDTO;
		firstRound: TournamentRoundDTO;
	};
};

/**
 * 試合開始イベント
 */
export type MatchStartedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.MATCH_STARTED;
	payload: {
		tournamentId: string;
		tournamentMatchId: string; // TournamentMatchId
		matchId: string; // 作成されたMatchのID（Pongゲーム用）
		match: TournamentMatchDTO;
	};
};

/**
 * 試合完了イベント
 */
export type MatchCompletedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.MATCH_COMPLETED;
	payload: {
		tournamentId: string;
		matchId: string; // TournamentMatchId
		winnerId: string; // TournamentParticipantId
		match: TournamentMatchDTO;
	};
};

/**
 * ラウンド完了イベント
 */
export type RoundCompletedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.ROUND_COMPLETED;
	payload: {
		tournamentId: string;
		roundNumber: number;
		completedRound: TournamentRoundDTO;
		nextRound?: TournamentRoundDTO;
	};
};

/**
 * トーナメント完了イベント
 */
export type TournamentCompletedEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.TOURNAMENT_COMPLETED;
	payload: {
		tournamentId: string;
		tournament: TournamentDTO;
		winnerId: string; // TournamentParticipantId
		winner: TournamentParticipantDTO;
	};
};

/**
 * エラーイベント
 */
export type TournamentErrorEvent = {
	type: typeof TOURNAMENT_WS_EVENTS.ERROR;
	payload: {
		message: string;
	};
};

/**
 * サーバーから送信されるWebSocketメッセージ
 */
export type TournamentServerMessage =
	| ParticipantJoinedEvent
	| TournamentStartedEvent
	| MatchStartedEvent
	| MatchCompletedEvent
	| RoundCompletedEvent
	| TournamentCompletedEvent
	| TournamentErrorEvent;
