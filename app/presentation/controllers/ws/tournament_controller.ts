import { TournamentId } from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { InMemoryTournamentClient } from "@infra/in_memory/tournament_client";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import type { FastifyInstance, FastifyRequest } from "fastify";

/**
 * Simplified WebSocket interface
 */
interface SimplifiedWebSocket {
	send(data: string): void;
	close(): void;
}

/**
 * クライアントからサーバーへのメッセージ
 */
type ClientMessage =
	| {
			type: "subscribe";
			payload: { tournamentId: string };
	  }
	| {
			type: "unsubscribe";
			payload: { tournamentId: string };
	  };

/**
 * トーナメントWebSocketコントローラー
 */
export const tournamentWsController = (
	tournamentClientRepository: ITournamentClientRepository,
	// biome-ignore lint/suspicious/noExplicitAny: Type import would cause circular dependency
	authPrehandler: any,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.get(
			"/tournaments",
			{
				websocket: true,
				preHandler: authPrehandler,
			},
			onConnectClient(tournamentClientRepository),
		);
	};
};

const onConnectClient = (
	tournamentClientRepository: ITournamentClientRepository,
) => {
	return async (connection: unknown, req: FastifyRequest) => {
		const userId = req.authenticatedUser?.id;

		if (!userId) {
			console.warn("[WS Tournament] Unauthenticated connection attempt");
			return;
		}

		// WebSocketアダプター: FastifyのconnectionをSimplifiedWebSocketインターフェースに適合させる
		// biome-ignore lint/suspicious/noExplicitAny: Fastify WebSocket connection型の互換性のため必要
		const connectionWithAny = connection as any;
		const webSocketAdapter: SimplifiedWebSocket = {
			send: (data: string) => connectionWithAny.send(data),
			close: () => connectionWithAny.close(),
		};

		const tournamentClient = new InMemoryTournamentClient(
			// biome-ignore lint/suspicious/noExplicitAny: WebSocketインターフェース互換性のため必要
			webSocketAdapter as any,
			userId,
		);

		// クライアントを登録
		tournamentClientRepository.add(tournamentClient);
		console.log(`[WS Tournament] User ${userId} connected`);

		// メッセージハンドラー
		connectionWithAny.on("message", async (data: Buffer) => {
			try {
				const message: ClientMessage = JSON.parse(data.toString());

				switch (message.type) {
					case "subscribe": {
						const tournamentId = new TournamentId(message.payload.tournamentId);
						tournamentClient.subscribeTournament(tournamentId);
						console.log(
							`[WS Tournament] User ${userId} subscribed to tournament ${tournamentId.value}`,
						);
						break;
					}
					case "unsubscribe": {
						const tournamentId = new TournamentId(message.payload.tournamentId);
						tournamentClient.unsubscribeTournament(tournamentId);
						console.log(
							`[WS Tournament] User ${userId} unsubscribed from tournament ${tournamentId.value}`,
						);
						break;
					}
					default:
						console.warn(
							"[WS Tournament] Unknown message type:",
							JSON.stringify(message),
						);
				}
			} catch (error) {
				console.error(
					"[WS Tournament] Error processing WebSocket message:",
					error,
				);
				// エラーを送信
				tournamentClient.send({
					type: TOURNAMENT_WS_EVENTS.ERROR,
					payload: {
						message: "Failed to process message",
					},
				});
			}
		});

		// クローズハンドラー
		connectionWithAny.on("close", () => {
			tournamentClientRepository.remove(tournamentClient);
			console.log(`[WS Tournament] User ${userId} disconnected`);
		});

		// エラーハンドラー
		connectionWithAny.on("error", (err: Error) => {
			console.error(
				`[WS Tournament] Connection error for user ${userId}:`,
				err,
			);
			tournamentClientRepository.remove(tournamentClient);
		});
	};
};
