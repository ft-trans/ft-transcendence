// import { ErrBadRequest } from "@domain/error";

import type { FastifyInstance, FastifyRequest } from "fastify";
import type WebSocket from "ws";
import type { PongGameServer } from "./pong_game_server";

export const pongController = (pongGameServer: PongGameServer) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/pong/matches/:match_id",
			{ websocket: true },
			onOpenWebSocket(pongGameServer),
		);
	};
};

const onOpenWebSocket = (pongGameServer: PongGameServer) => {
	return (
		socket: WebSocket,
		req: FastifyRequest<{ Params: { match_id: string } }>,
	) => {
		pongGameServer.addClient(req.params.match_id, socket);

		socket.onmessage = (event: WebSocket.MessageEvent) => {
			const message = event.data;
			// TODO ゲーム開始は後でちゃんと書く
			if (message.toString() === "start") {
				pongGameServer.startMatch(req.params.match_id);
			}
		};

		socket.onclose = () => {
			pongGameServer.deleteClient(req.params.match_id, socket);
		};

		socket.onerror = (_error) => {
			pongGameServer.deleteClient(req.params.match_id, socket);
		};
	};
};
