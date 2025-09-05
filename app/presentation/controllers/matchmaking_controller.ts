import type { JoinMatchmakingUseCase } from "@usecase/game/join_matchmaking_usecase";
import type { LeaveMatchmakingUseCase } from "@usecase/game/leave_matchmaking_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export const matchmakingController = (
	joinMatchmakingUseCase: JoinMatchmakingUseCase,
	leaveMatchmakingUseCase: LeaveMatchmakingUseCase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post(
			"/matchmaking/join",
			onJoinMatchmaking(joinMatchmakingUseCase),
		);

		fastify.post(
			"/matchmaking/leave",
			onLeaveMatchmaking(leaveMatchmakingUseCase),
		);
	};
};

const onJoinMatchmaking = (usecase: JoinMatchmakingUseCase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		// TODO: セッションからuserIdを取得する
		// **********************************************************
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID
		// **********************************************************

		const match = await usecase.execute(userId);

		// ここでマッチング成立するのか, APIでは待機レスポンスだけ送ってマッチ成立の通知はwebsocketで行うのかは要検討
		if (match) {
			reply.status(200).send({
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
			reply.status(202).send({
				message: "マッチング待機中です。別のプレイヤーをお待ちください。",
			});
		}
	};
};

const onLeaveMatchmaking = (usecase: LeaveMatchmakingUseCase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		// TODO: セッションからuserIdを取得する
		// **********************************************************
		const userId = "01K24DQHXAJ2NFYKPZ812F4HBJ"; // 仮のユーザーID
		// **********************************************************

		await usecase.execute(userId);

		reply.status(204).send();
	};
};
