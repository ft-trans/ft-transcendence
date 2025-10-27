import type {
	Tournament,
	TournamentMatch,
	TournamentParticipant,
	TournamentRound,
	User,
} from "@domain/model";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type {
	CreateTournamentRequest,
	CreateTournamentResponse,
	GetTournamentsResponse,
	RegisterTournamentResponse,
	StartTournamentMatchResponse,
	TournamentDetailDTO,
	TournamentDTO,
	TournamentMatchDTO,
	TournamentParticipantDTO,
	TournamentRoundDTO,
	UserInfo,
} from "@shared/api/tournament";
import type { CompleteMatchUsecase } from "@usecase/tournament/complete_match_usecase";
import type { CreateTournamentUsecase } from "@usecase/tournament/create_tournament_usecase";
import type { GetTournamentDetailUsecase } from "@usecase/tournament/get_tournament_detail_usecase";
import type { GetTournamentsUsecase } from "@usecase/tournament/get_tournaments_usecase";
import type { RegisterTournamentUsecase } from "@usecase/tournament/register_tournament_usecase";
import type { StartTournamentMatchUsecase } from "@usecase/tournament/start_tournament_match_usecase";
import type { StartTournamentUsecase } from "@usecase/tournament/start_tournament_usecase";
import type { UnregisterTournamentUsecase } from "@usecase/tournament/unregister_tournament_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const tournamentController = (
	getTournamentsUsecase: GetTournamentsUsecase,
	getTournamentDetailUsecase: GetTournamentDetailUsecase,
	createTournamentUsecase: CreateTournamentUsecase,
	registerTournamentUsecase: RegisterTournamentUsecase,
	unregisterTournamentUsecase: UnregisterTournamentUsecase,
	startTournamentUsecase: StartTournamentUsecase,
	startTournamentMatchUsecase: StartTournamentMatchUsecase,
	completeMatchUsecase: CompleteMatchUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		// GET /api/tournaments - トーナメント一覧取得
		fastify.get(
			"/tournaments",
			{ preHandler: authPrehandler },
			onGetTournaments(getTournamentsUsecase),
		);

		// POST /api/tournaments - トーナメント作成
		fastify.post(
			"/tournaments",
			{ preHandler: authPrehandler },
			onCreateTournament(createTournamentUsecase),
		);

		// GET /api/tournaments/:id - トーナメント詳細取得
		fastify.get(
			"/tournaments/:id",
			{ preHandler: authPrehandler },
			onGetTournamentDetail(getTournamentDetailUsecase),
		);

		// POST /api/tournaments/:id/register - トーナメント参加登録
		fastify.post(
			"/tournaments/:id/register",
			{ preHandler: authPrehandler },
			onRegisterTournament(registerTournamentUsecase),
		);

		// POST /api/tournaments/:id/unregister - トーナメント参加取消
		fastify.post(
			"/tournaments/:id/unregister",
			{ preHandler: authPrehandler },
			onUnregisterTournament(unregisterTournamentUsecase),
		);

		// POST /api/tournaments/:id/start - トーナメント開始
		fastify.post(
			"/tournaments/:id/start",
			{ preHandler: authPrehandler },
			onStartTournament(startTournamentUsecase),
		);

		// POST /api/tournaments/:id/matches/:matchId/start - トーナメント試合開始
		fastify.post(
			"/tournaments/:id/matches/:matchId/start",
			{ preHandler: authPrehandler },
			onStartTournamentMatch(startTournamentMatchUsecase),
		);

		// POST /api/tournaments/:id/matches/:matchId/complete - トーナメント試合完了
		fastify.post(
			"/tournaments/:id/matches/:matchId/complete",
			{ preHandler: authPrehandler },
			onCompleteTournamentMatch(completeMatchUsecase),
		);
	};
};

/**
 * Userドメインオブジェクトを簡略版UserInfoに変換
 */
const toUserInfo = (user: User): UserInfo => {
	return {
		id: user.id.value,
		username: user.username.value,
		avatar: user.avatar.value,
	};
};

/**
 * TournamentParticipantをDTOに変換
 */
const toParticipantDTO = (
	participant: TournamentParticipant,
	user: User,
): TournamentParticipantDTO => {
	return {
		id: participant.id.value,
		tournamentId: participant.tournamentId.value,
		userId: participant.userId.value,
		user: toUserInfo(user),
		status: participant.status.value,
	};
};

/**
 * TournamentMatchをDTOに変換
 */
const toMatchDTO = (
	match: TournamentMatch,
	participants: Array<{ participant: TournamentParticipant; user: User }>,
): TournamentMatchDTO => {
	return {
		id: match.id.value,
		tournamentId: match.tournamentId.value,
		roundId: match.roundId.value,
		matchId: match.matchId,
		participants: participants.map((p) =>
			toParticipantDTO(p.participant, p.user),
		),
		winnerId: match.winnerId?.value,
		status: match.status.value,
		completedAt: undefined, // TODO: Matchから取得
		createdAt: new Date().toISOString(), // TODO: Matchから取得
	};
};

/**
 * TournamentRoundをDTOに変換
 */
const _toRoundDTO = (
	round: TournamentRound,
	matches: Array<{
		match: TournamentMatch;
		participants: Array<{ participant: TournamentParticipant; user: User }>;
	}>,
): TournamentRoundDTO => {
	return {
		id: round.id.value,
		tournamentId: round.tournamentId.value,
		roundNumber: round.roundNumber.value,
		status: round.status.value,
		matches: matches.map((m) => toMatchDTO(m.match, m.participants)),
		createdAt: new Date().toISOString(), // TODO: データベースから取得
	};
};

/**
 * TournamentをDTOに変換（基本情報）
 */
const _toTournamentDTO = (
	tournament: Tournament,
	organizer: User,
	participantCount: number,
): TournamentDTO => {
	return {
		id: tournament.id.value,
		name: tournament.id.value, // TODO: name フィールドを追加する
		description: undefined, // TODO: description フィールドを追加する
		organizerId: tournament.organizerId.value,
		organizer: toUserInfo(organizer),
		status: tournament.status.value,
		maxParticipants: tournament.maxParticipants.value,
		participantCount,
		createdAt: new Date().toISOString(), // TODO: createdAt フィールドを追加する
		updatedAt: new Date().toISOString(), // TODO: updatedAt フィールドを追加する
	};
};

/**
 * GET /api/tournaments - トーナメント一覧取得
 */
const onGetTournaments = (usecase: GetTournamentsUsecase) => {
	return async (
		req: FastifyRequest<{
			Querystring: { status?: string; limit?: string; offset?: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const { status, limit, offset } = req.query;

			const result = await usecase.execute({
				status,
				limit: limit ? Number.parseInt(limit) : undefined,
				offset: offset ? Number.parseInt(offset) : undefined,
			});

			const responseBody: GetTournamentsResponse = {
				tournaments: result.tournaments.map((item) => ({
					id: item.tournament.id.value,
					name: item.tournament.id.value, // TODO: name フィールドを追加する
					description: undefined, // TODO: description フィールドを追加する
					organizerId: item.tournament.organizerId.value,
					organizer: toUserInfo(item.organizer),
					status: item.tournament.status.value,
					maxParticipants: item.tournament.maxParticipants.value,
					participantCount: item.participantCount,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})),
				total: result.tournaments.length,
			};

			return reply.send(responseBody);
		} catch (error) {
			console.error("[ERROR] GetTournaments failed:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	};
};

/**
 * POST /api/tournaments - トーナメント作成
 */
const onCreateTournament = (usecase: CreateTournamentUsecase) => {
	return async (
		req: FastifyRequest<{
			Body: CreateTournamentRequest;
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const { maxParticipants } = req.body;

			const tournament = await usecase.execute({
				organizerId: userId,
				maxParticipants,
			});

			// TODO: organizerとparticipantCountを取得する
			const responseBody: CreateTournamentResponse = {
				id: tournament.id.value,
				name: tournament.id.value,
				organizerId: tournament.organizerId.value,
				organizer: {
					id: userId,
					username: "", // TODO: ユーザー情報から取得
					avatar: "", // TODO: ユーザー情報から取得
				},
				status: tournament.status.value,
				maxParticipants: tournament.maxParticipants.value,
				participantCount: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			return reply.send(responseBody);
		} catch (error) {
			console.error("[ERROR] CreateTournament failed:", error);
			return reply.status(500).send({ error: "Internal server error" });
		}
	};
};

/**
 * GET /api/tournaments/:id - トーナメント詳細取得
 */
const onGetTournamentDetail = (usecase: GetTournamentDetailUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const result = await usecase.execute({
				tournamentId: req.params.id,
			});

			// 各ラウンドの試合に対して参加者情報を取得
			const roundsWithMatches = result.rounds.map((round) => {
				const roundMatches = result.matches.filter(
					(m) => m.roundId.value === round.id.value,
				);

				const matchesWithParticipants = roundMatches.map((match) => {
					// この試合の参加者を取得
					const matchParticipants = result.participants.filter((p) =>
						match.participantIds.some(
							(pid) => pid.value === p.participant.id.value,
						),
					);

					return { match, participants: matchParticipants };
				});

				return { round, matches: matchesWithParticipants };
			});

			const responseBody: TournamentDetailDTO = {
				id: result.tournament.id.value,
				name: result.tournament.id.value, // TODO: name フィールドを追加する
				description: undefined, // TODO: description フィールドを追加する
				organizerId: result.tournament.organizerId.value,
				organizer: toUserInfo(result.organizer),
				status: result.tournament.status.value,
				maxParticipants: result.tournament.maxParticipants.value,
				participantCount: result.participants.length,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				participants: result.participants.map((p) =>
					toParticipantDTO(p.participant, p.user),
				),
				rounds: roundsWithMatches.map((r) => _toRoundDTO(r.round, r.matches)),
			};

			return reply.send(responseBody);
		} catch (error) {
			console.error("[ERROR] GetTournamentDetail failed:", error);
			if (error instanceof Error && error.message.includes("見つかりません")) {
				return reply.status(404).send({ error: "Tournament not found" });
			}
			return reply.status(500).send({ error: "Internal server error" });
		}
	};
};

/**
 * POST /api/tournaments/:id/register - トーナメント参加登録
 */
const onRegisterTournament = (usecase: RegisterTournamentUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const result = await usecase.execute({
				tournamentId: req.params.id,
				userId,
			});

			const responseBody: RegisterTournamentResponse = {
				participant: {
					id: result.participant.id.value,
					tournamentId: result.participant.tournamentId.value,
					userId: result.participant.userId.value,
					user: toUserInfo(result.user),
					status: result.participant.status.value,
				},
			};

			return reply.send(responseBody);
		} catch (error) {
			console.error("[ERROR] RegisterTournament failed:", error);
			return reply.status(400).send({
				error: error instanceof Error ? error.message : "Bad request",
			});
		}
	};
};

/**
 * POST /api/tournaments/:id/unregister - トーナメント参加取消
 */
const onUnregisterTournament = (usecase: UnregisterTournamentUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			await usecase.execute({
				tournamentId: req.params.id,
				userId,
			});

			return reply.send({ success: true });
		} catch (error) {
			console.error("[ERROR] UnregisterTournament failed:", error);
			return reply.status(400).send({
				error: error instanceof Error ? error.message : "Bad request",
			});
		}
	};
};

/**
 * POST /api/tournaments/:id/start - トーナメント開始
 */
const onStartTournament = (usecase: StartTournamentUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const result = await usecase.execute({
				tournamentId: req.params.id,
				organizerId: userId,
			});

			return reply.send({
				tournament: {
					id: result.tournament.id.value,
					status: result.tournament.status.value,
				},
				firstRound: {
					id: result.firstRound.id.value,
					roundNumber: result.firstRound.roundNumber.value,
				},
			});
		} catch (error) {
			console.error("[ERROR] StartTournament failed:", error);
			return reply.status(400).send({
				error: error instanceof Error ? error.message : "Bad request",
			});
		}
	};
};

/**
 * POST /api/tournaments/:id/matches/:matchId/start - トーナメント試合開始
 */
const onStartTournamentMatch = (usecase: StartTournamentMatchUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string; matchId: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const result = await usecase.execute({
				tournamentMatchId: req.params.matchId,
			});

			const responseBody: StartTournamentMatchResponse = {
				matchId: result.matchId,
			};

			return reply.send(responseBody);
		} catch (error) {
			console.error("[ERROR] StartTournamentMatch failed:", error);
			return reply.status(400).send({
				error: error instanceof Error ? error.message : "Bad request",
			});
		}
	};
};

/**
 * POST /api/tournaments/:id/matches/:matchId/complete - トーナメント試合完了
 */
const onCompleteTournamentMatch = (usecase: CompleteMatchUsecase) => {
	return async (
		req: FastifyRequest<{
			Params: { id: string; matchId: string };
			Body: { winnerId: string };
		}>,
		reply: FastifyReply,
	) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				return reply.status(401).send({ error: "Unauthorized" });
			}

			const { winnerId } = req.body;

			const result = await usecase.execute({
				matchId: req.params.matchId,
				winnerId,
				requesterId: userId,
			});

			return reply.send({
				match: {
					id: result.match.id.value,
					status: result.match.status.value,
					winnerId: result.match.winnerId?.value,
				},
				isRoundCompleted: result.isRoundCompleted,
				isTournamentCompleted: result.isTournamentCompleted,
			});
		} catch (error) {
			console.error("[ERROR] CompleteTournamentMatch failed:", error);
			return reply.status(400).send({
				error: error instanceof Error ? error.message : "Bad request",
			});
		}
	};
};
