import type { FastifyInstance } from "fastify";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { IMatchmakingClientRepository } from "@infra/in_memory/matchmaking_client_repository";

export const matchmakingWsController = (
	authPrehandler: AuthPrehandler,
	clientRepository: IMatchmakingClientRepository,
) => {
	return (fastify: FastifyInstance) => {
		fastify.get(
			"/matchmaking",
			{ websocket: true, preHandler: [authPrehandler] },
			(connection, req) => {
				const userId = req.authenticatedUser!.id;
				console.log(`[WS Matchmaking] Client connected: ${userId}`);
				clientRepository.add(userId, connection, req);

                connection.on("close", () => {
                    console.log(`[WS Matchmaking] Client disconnected: ${userId}`);
                    clientRepository.remove(userId);
                });
			},
		);
	};
};