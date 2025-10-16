import { MatchId, type User } from "@domain/model";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { PongPlayerInfo } from "@shared/api/pong";
import type { AcceptGameInviteUsecase } from "@usecase/game/accept_game_invite_usecase";
import type { GetMatchPlayersUseCase } from "@usecase/game/get_match_players_usecase";
import type { GetMatchUseCase } from "@usecase/game/get_match_usecase";
import type { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import type { LeaveMatchmakingUseCase } from "@usecase/game/leave_matchmaking_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const matchmakingController = (
	getMatchUseCase: GetMatchUseCase,
	getMatchPlayersUseCase: GetMatchPlayersUseCase,
	joinMatchmakingUseCase: JoinMatchmakingUseCase,
	leaveMatchmakingUseCase: LeaveMatchmakingUseCase,
	acceptGameInviteUsecase: AcceptGameInviteUsecase,
	startPongUsecase: StartPongUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		const routeOptions = {
			preHandler: [authPrehandler],
		};
		fastify.get("/matchmaking", routeOptions, onGetMatch(getMatchUseCase));
		fastify.get(
			"/matchmaking/:match_id/players",
			routeOptions,
			onGetMatchPlayers(getMatchPlayersUseCase),
		);
		fastify.post(
			"/matchmaking/join",
			routeOptions,
			onJoinMatchmaking(joinMatchmakingUseCase, startPongUsecase),
		);

		fastify.post(
			"/matchmaking/leave",
			routeOptions,
			onLeaveMatchmaking(leaveMatchmakingUseCase),
		);

		fastify.post(
			"/game/invite/accept",
			routeOptions,
			onAcceptGameInvite(acceptGameInviteUsecase),
		);
	};
};

const onGetMatch = (usecase: GetMatchUseCase) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		const match = await usecase.execute(userId);
		if (match) {
			return reply.status(200).send({
				id: match.id,
				participants: match.participants.map((p) => ({ id: p.id.value })),
				status: match.status,
				gameType: match.gameType,
				createdAt: match.createdAt,
			});
		}
		return reply.status(204).send();
	};
};

const toPongPlayerInfo = (player: User | undefined): PongPlayerInfo => {
	return player
		? {
				userId: player.id.value,
				username: player.username.value,
				avatar: player.avatar.value,
			}
		: undefined;
};

const onGetMatchPlayers = (usecase: GetMatchPlayersUseCase) => {
	return async (
		request: FastifyRequest<{ Params: { match_id: string } }>,
		reply: FastifyReply,
	) => {
		const matchId = new MatchId(request.params.match_id);
		const player1 = await usecase.execute(matchId, "player1");
		const player2 = await usecase.execute(matchId, "player2");
		const response = {
			player1: toPongPlayerInfo(player1),
			player2: toPongPlayerInfo(player2),
		};
		return reply.status(200).send(response);
	};
};

const onJoinMatchmaking = (
	usecase: JoinMatchmakingUseCase,
	startPongUsecase: StartPongUsecase,
) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		const match = await usecase.execute(userId);

		if (match) {
			await startPongUsecase.execute({ matchId: match.id });
			return reply.status(200).send({
				message: "マッチしました！",
				match: {
					id: match.id,
					participants: match.participants.map((p) => ({ id: p.id.value })),
					status: match.status,
					gameType: match.gameType,
					createdAt: match.createdAt,
				},
			});
		} else {
			return reply.status(202).send({
				message: "マッチング待機中です。別のプレイヤーをお待ちください。",
			});
		}
	};
};

const onLeaveMatchmaking = (usecase: LeaveMatchmakingUseCase) => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		await usecase.execute(userId);
		return reply.status(204).send();
	};
};

const onAcceptGameInvite = (usecase: AcceptGameInviteUsecase) => {
	return async (
		request: FastifyRequest<{ Body: { senderId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = request.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}

		const { senderId } = request.body;
		if (!senderId) {
			return reply.status(400).send({ message: "senderId is required" });
		}

		try {
			const result = await usecase.execute({
				accepterId: userId,
				senderId,
			});

			return reply.status(200).send({
				message: "ゲーム招待を受理しました",
				success: result.success,
			});
		} catch (error) {
			console.error("Failed to accept game invite:", error);
			return reply.status(500).send({ message: "Internal server error" });
		}
	};
};
