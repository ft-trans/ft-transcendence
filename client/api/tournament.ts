import type {
	CompleteTournamentMatchRequest,
	CompleteTournamentMatchResponse,
	CreateTournamentRequest,
	CreateTournamentResponse,
	GetTournamentsQuery,
	GetTournamentsResponse,
	RegisterTournamentResponse,
	StartTournamentMatchResponse,
	TournamentDetailDTO,
} from "@shared/api/tournament";
import { ApiClient } from "./api_client";

const apiClient = new ApiClient();

/**
 * トーナメント一覧を取得
 */
export const getTournaments = async (
	query?: GetTournamentsQuery,
): Promise<GetTournamentsResponse> => {
	const params = new URLSearchParams();
	if (query?.status) params.append("status", query.status);
	if (query?.limit) params.append("limit", query.limit.toString());
	if (query?.offset) params.append("offset", query.offset.toString());

	const queryString = params.toString();
	const path = queryString
		? `/api/tournaments?${queryString}`
		: "/api/tournaments";

	return apiClient.get<GetTournamentsResponse>(path);
};

/**
 * トーナメント詳細を取得
 */
export const getTournamentDetail = async (
	tournamentId: string,
): Promise<TournamentDetailDTO> => {
	return apiClient.get<TournamentDetailDTO>(`/api/tournaments/${tournamentId}`);
};

/**
 * トーナメントを作成
 */
export const createTournament = async (
	request: CreateTournamentRequest,
): Promise<CreateTournamentResponse> => {
	return apiClient.post<CreateTournamentRequest, CreateTournamentResponse>(
		"/api/tournaments",
		request,
	);
};

/**
 * トーナメントに参加登録
 */
export const registerTournament = async (
	tournamentId: string,
): Promise<RegisterTournamentResponse> => {
	return apiClient.post<unknown, RegisterTournamentResponse>(
		`/api/tournaments/${tournamentId}/register`,
		{},
	);
};

/**
 * トーナメント参加を取消
 */
export const unregisterTournament = async (
	tournamentId: string,
): Promise<void> => {
	return apiClient.post<unknown, void>(
		`/api/tournaments/${tournamentId}/unregister`,
		{},
	);
};

/**
 * トーナメントを開始（主催者のみ）
 */
export const startTournament = async (
	tournamentId: string,
): Promise<TournamentDetailDTO> => {
	return apiClient.post<unknown, TournamentDetailDTO>(
		`/api/tournaments/${tournamentId}/start`,
		{},
	);
};

/**
 * トーナメント試合を開始
 */
export const startTournamentMatch = async (
	tournamentId: string,
	matchId: string,
): Promise<StartTournamentMatchResponse> => {
	return apiClient.post<unknown, StartTournamentMatchResponse>(
		`/api/tournaments/${tournamentId}/matches/${matchId}/start`,
		{},
	);
};

/**
 * トーナメント試合を完了
 */
export const completeTournamentMatch = async (
	tournamentId: string,
	matchId: string,
	request: CompleteTournamentMatchRequest,
): Promise<CompleteTournamentMatchResponse> => {
	return apiClient.post<
		CompleteTournamentMatchRequest,
		CompleteTournamentMatchResponse
	>(`/api/tournaments/${tournamentId}/matches/${matchId}/complete`, request);
};
