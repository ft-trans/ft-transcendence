import { MatchId } from "@domain/model";
import { PongClient } from "@infra/in_memory/pong_client";
import { PONG_COMMAND, type PongCommand } from "@shared/api/pong";
import type { JoinPongUsecase } from "@usecase/pong/join_pong_usecase";
import type { LeavePongUsecase } from "@usecase/pong/leave_pong_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { UpdatePongPaddleUsecase } from "@usecase/pong/update_pong_paddle_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type WebSocket from "ws";

export const pongController = (
	joinPongUsecase: JoinPongUsecase,
	leavePongUsecase: LeavePongUsecase,
	startPongUsecase: StartPongUsecase,
	updatePongPaddleUsecase: UpdatePongPaddleUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/pong/matches/:match_id",
			{ websocket: true },
			onConnectClient(
				joinPongUsecase,
				leavePongUsecase,
				startPongUsecase,
				updatePongPaddleUsecase,
			),
		);
	};
};

const onConnectClient = (
	joinPongUsecase: JoinPongUsecase,
	leavePongUsecase: LeavePongUsecase,
	startPongUsecase: StartPongUsecase,
	updatePongPaddleUsecase: UpdatePongPaddleUsecase,
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
			execCommand(
				message.toString() as PongCommand,
				matchId,
				startPongUsecase,
				updatePongPaddleUsecase,
			);
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

const execCommand = (
	command: PongCommand,
	matchId: MatchId,
	startPongUsecase: StartPongUsecase,
	updatePongPaddleUsecase: UpdatePongPaddleUsecase,
) => {
	switch (command) {
		case PONG_COMMAND.START:
			startPongUsecase.execute({ matchId: matchId.value });
			break;
		case PONG_COMMAND.PADDLE1_UP:
			updatePongPaddleUsecase.execute({
				matchId: matchId.value,
				player: "player1",
				direction: "up",
			});
			break;
		case PONG_COMMAND.PADDLE2_UP:
			updatePongPaddleUsecase.execute({
				matchId: matchId.value,
				player: "player2",
				direction: "up",
			});
			break;
		case PONG_COMMAND.PADDLE1_DOWN:
			updatePongPaddleUsecase.execute({
				matchId: matchId.value,
				player: "player1",
				direction: "down",
			});
			break;
		case PONG_COMMAND.PADDLE2_DOWN:
			updatePongPaddleUsecase.execute({
				matchId: matchId.value,
				player: "player2",
				direction: "down",
			});
			break;
		default:
			return;
	}
	return;
};
