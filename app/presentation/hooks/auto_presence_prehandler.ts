import { UserId } from "@domain/model/user";
import type { IRepository } from "@domain/repository";
import type {
	FastifyReply,
	FastifyRequest,
	HookHandlerDoneFunction,
} from "fastify";

/**
 * 自動プレゼンス更新プレハンドラー
 * 認証済みユーザーの通常のAPIリクエストを自動的にheartbeatとして扱い、
 * オンライン状態を延長する
 *
 * 注: このミドルウェアはSessionBasedPresenceServiceが利用可能な場合は
 * そちらに委譲し、利用できない場合のフォールバックとして機能します
 */
export class AutoPresencePrehandler {
	// オンライン状態のTTL（秒）
	private static readonly ONLINE_TTL = 300; // 5分

	constructor(private readonly repository: IRepository) {}

	/**
	 * プレハンドラー関数
	 * 認証済みユーザーのリクエストに対して自動的にオンライン状態を延長
	 */
	handler = async (
		request: FastifyRequest,
		_reply: FastifyReply,
		done: HookHandlerDoneFunction,
	): Promise<void> => {
		try {
			const userId = request.authenticatedUser?.id;

			// 認証されていない場合はスキップ
			if (!userId) {
				return done();
			}

			// プレゼンス更新を非同期実行（リクエストをブロックしない）
			// セッション管理が統合されているため、ここでは単純に延長のみ実行
			this.updatePresenceAsync(userId).catch((error) => {
				// エラーログは記録するが、リクエスト処理は続行
				console.error(
					`[AutoPresence] Failed to update presence for user ${userId}:`,
					error,
				);
			});

			done();
		} catch (error) {
			// プレゼンス更新でエラーが発生してもリクエスト処理は続行
			console.error("[AutoPresence] Prehandler error:", error);
			done();
		}
	};

	/**
	 * プレゼンス状態を非同期で更新
	 */
	private async updatePresenceAsync(userId: string): Promise<void> {
		const presenceRepo = this.repository.newUserPresenceRepository();
		await presenceRepo.extendUserOnline(
			new UserId(userId),
			AutoPresencePrehandler.ONLINE_TTL,
		);

		console.debug(`[AutoPresence] Extended online status for user ${userId}`);
	}

	/**
	 * 特定の認証済みAPIエンドポイントで使用する関数を生成
	 */
	static create(repository: IRepository) {
		const handler = new AutoPresencePrehandler(repository);
		return handler.handler;
	}
}
