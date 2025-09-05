import { MatchId } from "@domain/model";
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
	return async (
		socket: WebSocket,
		req: FastifyRequest<{ Params: { match_id: string } }>,
	) => {
		const matchId = new MatchId(req.params.match_id);

		pongGameServer.addClient(matchId, socket);

		socket.onmessage = (event: WebSocket.MessageEvent) => {
			const message = event.data;
			// TODO ゲーム開始は後でちゃんと書く
			if (message.toString() === "start") {
				pongGameServer.startMatch(matchId);
			}
		};

		socket.onclose = () => {
			pongGameServer.deleteClient(matchId, socket);
		};

		socket.onerror = (_error) => {
			pongGameServer.deleteClient(matchId, socket);
		};
	};
};
