import type { IMatchmakingClientRepository } from "@infra/in_memory/matchmaking_client_repository";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { SetUserOnlineUsecase } from "@usecase/presence";
import type { FastifyInstance } from "fastify";

export const matchmakingWsController = (
	authPrehandler: AuthPrehandler,
	clientRepository: IMatchmakingClientRepository,
	setUserOnlineUsecase: SetUserOnlineUsecase,
	// 新しいシステムでは offline/extend は自動管理されるため削除
) => {
	return (fastify: FastifyInstance) => {
		fastify.get(
			"/matchmaking",
			{ websocket: true, preHandler: [authPrehandler] },
			async (connection, req) => {
				const userId = req.authenticatedUser?.id;
				console.log(`[WS Matchmaking] Client connected: ${userId}`);

				if (userId) {
					// ユーザーをオンライン状態にする（WebSocket接続開始時のみ）
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

					// 新しいシステムでは専用ハートビートは不要
					// プレゼンス状態は通常のAPIリクエストとセッション管理で自動更新される

					connection.on("close", async () => {
						console.log(`[WS Matchmaking] Client disconnected: ${userId}`);
						clientRepository.remove(userId);
						
						// 新しいシステムでは明示的なオフライン化は不要
						// セッション管理で自動的にハンドリングされる
						console.log(`[WS Matchmaking] User ${userId} presence will auto-expire`);
					});
				}
			},
		);
	};
};
