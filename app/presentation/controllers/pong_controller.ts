// import { ErrBadRequest } from "@domain/error";

import type { EndPongUsecase } from "@usecase/pong/end_pong_usecase";
import type { GetPongStateUsecase } from "@usecase/pong/get_pong_state_usecase";
import type { StartPongUsecase } from "@usecase/pong/start_pong_usecase";
import type { FastifyInstance, FastifyRequest } from "fastify";
import WebSocket from "ws";

export const pongController = (
	getPongStateUsecase: GetPongStateUsecase,
	startPongUsecase: StartPongUsecase,
	endPongUsecase: EndPongUsecase,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/pong/matches/:match_id",
			{ websocket: true },
			onLoad(getPongStateUsecase, startPongUsecase, endPongUsecase),
		);
	};
};

const connectedClients = new Map<string, Set<WebSocket>>();

const onLoad = (
	getPongStateUsecase: GetPongStateUsecase,
	startPongUsecase: StartPongUsecase,
	endPongUsecase: EndPongUsecase,
) => {
	const addClient = (matchId: string, socket: WebSocket) => {
		if (!connectedClients.has(matchId)) {
			connectedClients.set(matchId, new Set<WebSocket>());
		}
		connectedClients.get(matchId)?.add(socket);
	};

	const deleteClient = (matchId: string, socket: WebSocket) => {
		connectedClients.get(matchId)?.delete(socket);
		if (connectedClients.get(matchId)?.size === 0) {
			connectedClients.delete(matchId);
			endPongUsecase.execute({ matchId });
		}
	};

	return (
		socket: WebSocket,
		req: FastifyRequest<{ Params: { match_id: string } }>,
	) => {
		addClient(req.params.match_id, socket);

		socket.onmessage = (event: WebSocket.MessageEvent) => {
			const message = event.data;
			if (message.toString() === "start") {
				console.log("---------Starting Pong game:", req.params.match_id);
				startPongUsecase.execute({ matchId: req.params.match_id });
			}
		};

		socket.onclose = () => {
			deleteClient(req.params.match_id, socket);
		};

		socket.onerror = (_error) => {
			deleteClient(req.params.match_id, socket);
		};

		setInterval(() => {
			connectedClients.forEach((clients: Set<WebSocket>, matchId: string) => {
				getPongStateUsecase.execute({ matchId }).then((state) => {
					clients.forEach((client: WebSocket) => {
						if (client.readyState === WebSocket.OPEN) {
							client.send(
								JSON.stringify({
									event: "gameState",
									payload: state.toPayload(),
								}),
							);
						} else {
							deleteClient(matchId, client);
						}
					});
				});
			});
		}, 1000 / 60); // 60 FPS
	};
};
