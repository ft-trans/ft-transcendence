import type { IMatchmakingClientRepository } from "@infra/in_memory/matchmaking_client_repository";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type {
	ExtendUserOnlineUsecase,
	SetUserOfflineUsecase,
	SetUserOnlineUsecase,
} from "@usecase/presence";
import type { FastifyInstance } from "fastify";

export const matchmakingWsController = (
	authPrehandler: AuthPrehandler,
	clientRepository: IMatchmakingClientRepository,
	setUserOnlineUsecase: SetUserOnlineUsecase,
	setUserOfflineUsecase: SetUserOfflineUsecase,
	extendUserOnlineUsecase: ExtendUserOnlineUsecase,
) => {
	return (fastify: FastifyInstance) => {
		fastify.get(
			"/matchmaking",
			{ websocket: true, preHandler: [authPrehandler] },
			async (connection, req) => {
				const userId = req.authenticatedUser?.id;
				console.log(`[WS Matchmaking] Client connected: ${userId}`);

				if (userId) {
					// ユーザーをオンライン状態にする
					try {
						await setUserOnlineUsecase.execute(userId);
						console.log(`[WS Matchmaking] User ${userId} set to online`);
					} catch (error) {
						console.error(
							`[WS Matchmaking] Failed to set user ${userId} online:`,
							error,
						);
					}

					clientRepository.add(userId, connection, req);

					// ハートビート機能：定期的にオンライン状態を延長
					const heartbeatInterval = setInterval(async () => {
						try {
							await extendUserOnlineUsecase.execute(userId);
						} catch (error) {
							console.error(
								`[WS Matchmaking] Heartbeat failed for user ${userId}:`,
								error,
							);
						}
					}, 60000); // 1分ごと

					connection.on("close", async () => {
						console.log(`[WS Matchmaking] Client disconnected: ${userId}`);
						clearInterval(heartbeatInterval);
						clientRepository.remove(userId);

						// ユーザーをオフライン状態にする
						try {
							await setUserOfflineUsecase.execute(userId);
							console.log(`[WS Matchmaking] User ${userId} set to offline`);
						} catch (error) {
							console.error(
								`[WS Matchmaking] Failed to set user ${userId} offline:`,
								error,
							);
						}
					});
				}
			},
		);
	};
};
