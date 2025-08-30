import { z } from "zod";

export const updateProfileFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください"),
});

export type UpdateProfileRequest = {
	user: {
		email: string;
	};
};

export type UpdateProfileResponse = {
	user: {
		id: string;
		email: string;
	};
};
