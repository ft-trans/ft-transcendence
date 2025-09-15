import { MatchId } from "@domain/model";
import { PongClient } from "@infra/in_memory/pong_client";
import type { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import type { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type WebSocket from "ws";

export const pongController = (
	joinPongUsecase: JoinPongUsecase,
	leavePongUsecase: LeavePongUsecase,
	startPongUsecase: StartPongUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/pong/matches/:match_id",
			{ websocket: true },
			onConnectClient(joinPongUsecase, leavePongUsecase, startPongUsecase),
		);
	};
};

const onConnectClient = (
	joinPongUsecase: JoinPongUsecase,
	leavePongUsecase: LeavePongUsecase,
	startPongUsecase: StartPongUsecase,
) => {
	return async (
		socket: WebSocket,
		req: FastifyRequest<{ Params: { match_id: string } }>,
	) => {
		const matchId = new MatchId(req.params.match_id);
		const pongClient = new PongClient(socket);

		await joinPongUsecase.execute({
			matchId: matchId.value,
			client: pongClient,
		});

		socket.onmessage = (event: WebSocket.MessageEvent) => {
			const message = event.data;
			// TODO onmessageはゲーム実装時にちゃんと書く
			// TODO イベントの種類を./shared/apiで管理
			if (message.toString() === "start") {
				startPongUsecase.execute({ matchId: matchId.value });
			}
		};

		socket.onclose = () => {
			leavePongUsecase.execute({
				matchId: matchId.value,
				client: pongClient,
			});
		};

		socket.onerror = (_err) => {
			leavePongUsecase.execute({
				matchId: matchId.value,
				client: pongClient,
			});
		};
	};
};
