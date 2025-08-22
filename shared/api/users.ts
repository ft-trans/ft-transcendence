import { z } from "zod";

export const updateUserFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください"),
});

export type UpdateUserRequest = {
	user: {
		email: string;
	};
};

export type UpdateUserResponse = {
	user: {
		id: string;
		email: string;
	};
};
