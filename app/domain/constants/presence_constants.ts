/**
 * プレゼンス管理の定数
 * 各サービス間で一貫性を保つために共有定数として定義
 */
export const PRESENCE_CONSTANTS = {
	/** オンライン状態のTTL（秒） - 5分 */
	ONLINE_TTL: 300,

	/** オンライン判定の閾値（秒） - 5分 */
	ONLINE_THRESHOLD: 300,

	/** レート制限の最小間隔（秒） - 30秒 */
	MIN_UPDATE_INTERVAL: 30,

	/** クリーンアップの実行間隔（ミリ秒） - 1分 */
	CLEANUP_INTERVAL: 60000,

	/** セッション情報の保持期間倍率 */
	SESSION_CLEANUP_MULTIPLIER: 2,
} as const;
