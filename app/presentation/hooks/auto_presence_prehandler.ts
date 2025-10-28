import type { IRepository } from "@domain/repository";
import { UserId } from "@domain/model/user";
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from "fastify";

/**
 * 自動プレゼンス更新プレハンドラー
 * 認証済みユーザーの通常のAPIリクエストを自動的にheartbeatとして扱い、
 * オンライン状態を延長する
 */
export class AutoPresencePrehandler {
	// リクエスト間隔制限（秒）- 同じユーザーの頻繁なリクエストを制限
	private static readonly MIN_UPDATE_INTERVAL = 30;
	
	// 最後の更新時刻を記録（メモリ内キャッシュ）
	private static lastUpdateTimes = new Map<string, number>();
	
	// オンライン状態のTTL（秒）
	private static readonly ONLINE_TTL = 180; // 3分

	constructor(private readonly repository: IRepository) {}

	/**
	 * プレハンドラー関数
	 * 認証済みユーザーのリクエストに対して自動的にオンライン状態を延長
	 */
	handler = async (
		request: FastifyRequest,
		reply: FastifyReply,
		done: HookHandlerDoneFunction,
	): Promise<void> => {
		try {
			const userId = request.authenticatedUser?.id;
			
			// 認証されていない場合はスキップ
			if (!userId) {
				return done();
			}

			// 頻繁な更新を防ぐためのレート制限
			const now = Date.now();
			const lastUpdate = AutoPresencePrehandler.lastUpdateTimes.get(userId);
			
			if (lastUpdate && (now - lastUpdate) < (AutoPresencePrehandler.MIN_UPDATE_INTERVAL * 1000)) {
				// 最小間隔以内の場合は更新をスキップ
				return done();
			}

			// プレゼンス更新を非同期実行（リクエストをブロックしない）
			this.updatePresenceAsync(userId).catch(error => {
				// エラーログは記録するが、リクエスト処理は続行
				console.error(`[AutoPresence] Failed to update presence for user ${userId}:`, error);
			});

			// 最終更新時刻を記録
			AutoPresencePrehandler.lastUpdateTimes.set(userId, now);

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
		try {
			const presenceRepo = this.repository.newUserPresenceRepository();
			await presenceRepo.extendUserOnline(
				new UserId(userId),
				AutoPresencePrehandler.ONLINE_TTL
			);
			
			console.debug(`[AutoPresence] Extended online status for user ${userId}`);
		} catch (error) {
			throw error;
		}
	}

	/**
	 * 特定の認証済みAPIエンドポイントで使用する関数を生成
	 */
	static create(repository: IRepository) {
		const handler = new AutoPresencePrehandler(repository);
		return handler.handler;
	}

	/**
	 * メモリ内キャッシュのクリーンアップ
	 * 定期的に呼び出してメモリリークを防ぐ
	 */
	static cleanupCache(): void {
		const now = Date.now();
		const expireTime = 10 * 60 * 1000; // 10分
		
		for (const [userId, lastUpdate] of AutoPresencePrehandler.lastUpdateTimes.entries()) {
			if (now - lastUpdate > expireTime) {
				AutoPresencePrehandler.lastUpdateTimes.delete(userId);
			}
		}
	}
}