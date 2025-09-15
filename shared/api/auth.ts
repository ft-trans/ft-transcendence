import { z } from "zod";

export const registerUserFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください"),
	password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

export type RegisterUserRequest = {
	user: {
		email: string;
		password: string;
	};
};

export type RegisterUserResponse = {
	user: {
		id: string;
		email: string;
	};
};
