import { z } from "zod";

export const updateProfileFormSchema = z
	.object({
		email: z.email("有効なメールアドレスを入力してください"),
		username: z
			.string()
			.min(3, "ユーザー名は3文字以上にして下さい")
			.max(30, "ユーザー名は30文字以下にしてください")
			.regex(
				/^[a-zA-Z0-9_-]+$/,
				"ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です",
			),
		avatar: z.string().max(500).optional(),
		password: z
			.string()
			// 必須になってしまうためコメントアウト。
			// .min(8, "パスワードは8文字以上である必要があります")
			.optional(),
		passwordConfirm: z.string().optional(),
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "パスワードが一致しません",
		path: ["passwordConfirm"],
	});

// パスワード変更する場合のスキーマ
export const updateProfileFormSchemaWithPassword = z
	.object({
		email: z.email("有効なメールアドレスを入力してください"),
		username: z
			.string()
			.min(3, "ユーザー名は3文字以上にして下さい")
			.max(30, "ユーザー名は30文字以下にしてください")
			.regex(
				/^[a-zA-Z0-9_-]+$/,
				"ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です",
			),
		avatar: z.string().max(500).optional(),
		password: z
			.string()
			.min(8, "パスワードは8文字以上である必要があります")
			.optional(),
		passwordConfirm: z.string().optional(),
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "パスワードが一致しません",
		path: ["passwordConfirm"],
	});

export const uploadAvatarFormSchema = z.object({
	file: z
		.any()
		.refine((file) => file instanceof File, "ファイルが必要です")
		.refine(
			(file) => file.size <= 5 * 1024 * 1024,
			"ファイルサイズは5MB以下にしてください",
		)
		.refine(
			(file) =>
				["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
					file.type,
				),
			"サポートされていないファイル形式です（JPEG、PNG、GIF、WebPのみ）",
		),
});

export type GetProfileResponse = {
	user: {
		id: string;
		email: string;
		username: string;
		avatar: string;
		status: string;
	};
};

export type UpdateProfileRequest = {
	user: {
		email?: string;
		username?: string;
		avatar?: string;
		password?: string;
		passwordConfirm?: string;
	};
};

export type UploadAvatarRequest = FormData;

export type UploadAvatarResponse = {
	user: {
		id: string;
		email: string;
		username: string;
		avatar: string;
		status: string;
	};
};

export type UpdateProfileResponse = {
	user: {
		id: string;
		email: string;
		username: string;
		avatar: string;
		status: string;
	};
};

export type UserStats = {
	totalMatches: number;
	wins: number;
	losses: number;
	winRate: number;
};

export type GetUserStatsResponse = {
	stats: UserStats;
};

export type MatchHistoryResponse = {
	id: string;
	matchId: string;
	winnerId: string;
	winner: { id: string; username: string; avatar: string };
	loserId: string;
	loser: { id: string; username: string; avatar: string };
	winnerScore: number;
	loserScore: number;
	playedAt: Date;
};

export type GetMatchHistoriesResponse = {
	histories: MatchHistoryResponse[];
};
