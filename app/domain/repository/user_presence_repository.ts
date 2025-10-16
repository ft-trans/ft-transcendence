import type { UserId } from "@domain/model/user";

export interface IUserPresenceRepository {
	/**
	 * ユーザーをオンライン状態にする
	 * @param userId ユーザーID
	 * @param ttl オンライン状態の有効期限（秒）、デフォルトは300秒（5分）
	 */
	setUserOnline(userId: UserId, ttl?: number): Promise<void>;

	/**
	 * ユーザーをオフライン状態にする
	 * @param userId ユーザーID
	 */
	setUserOffline(userId: UserId): Promise<void>;

	/**
	 * ユーザーがオンライン状態かどうかを確認
	 * @param userId ユーザーID
	 * @returns オンライン状態の場合true
	 */
	isUserOnline(userId: UserId): Promise<boolean>;

	/**
	 * 複数のユーザーのオンライン状態を一括確認
	 * @param userIds ユーザーIDの配列
	 * @returns ユーザーIDとオンライン状態のマップ
	 */
	getUsersOnlineStatus(userIds: UserId[]): Promise<Map<string, boolean>>;

	/**
	 * 現在オンラインのユーザー一覧を取得
	 * @returns オンラインユーザーのID配列
	 */
	getOnlineUsers(): Promise<UserId[]>;

	/**
	 * ユーザーのオンライン状態の有効期限を延長する（heartbeat機能）
	 * @param userId ユーザーID
	 * @param ttl 延長する時間（秒）
	 */
	extendUserOnline(userId: UserId, ttl?: number): Promise<void>;
}
