import { z } from "zod";

export const registerUserFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください"),
});

export type RegisterUserRequest = {
	user: {
		email: string;
	};
};

export type RegisterUserResponse = {
	user: {
		id: string;
		email: string;
	};
};
