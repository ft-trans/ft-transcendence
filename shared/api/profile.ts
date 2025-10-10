import { z } from "zod";

export const updateProfileFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください").optional(),
	username: z
		.string()
		.min(1)
		.max(30)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	avatar: z.string().max(500).optional(),
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
