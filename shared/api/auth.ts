import { z } from "zod";

export const registerUserFormSchema = z.object({
	user: z.object({
		email: z.email("有効なメールアドレスを入力してください"),
	}),
});

export type RegisterUserRequest = z.infer<typeof registerUserFormSchema>;

export type RegisterUserResponse = {
	user: {
		id: string;
		email: string;
	};
};
