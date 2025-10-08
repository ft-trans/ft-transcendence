import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { GetMatchUseCase } from "@usecase/game/get_match_usecase";
import type { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import type { LeaveMatchmakingUseCase } from "@usecase/game/leave_matchmaking_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const matchmakingController = (
	getMatchUseCase: GetMatchUseCase,
	joinMatchmakingUseCase: JoinMatchmakingUseCase,
	leaveMatchmakingUseCase: LeaveMatchmakingUseCase,
	startPongUsecase: StartPongUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		const routeOptions = {
			preHandler: [authPrehandler],
		};
		fastify.get("/matchmaking", routeOptions, onGetMatch(getMatchUseCase));
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
