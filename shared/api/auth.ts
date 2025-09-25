import { z } from "zod";

export const registerUserFormSchema = z
	.object({
		email: z.email("有効なメールアドレスを入力してください"),
		password: z.string().min(8, "パスワードは8文字以上である必要があります"),
		passwordConfirm: z.string(),
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "パスワードが一致しません",
		path: ["passwordConfirm"],
	});

export const loginUserFormSchema = z.object({
	email: z.email("有効なメールアドレスを入力してください"),
	password: z.string().min(1, "パスワードを入力してください"),
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

export type LoginUserRequest = {
	user: {
		email: string;
		password: string;
	};
};

export type LoginUserResponse = {
	user: {
		id: string;
		email: string;
	};
};

export type AuthStatusResponse = {
	user?: {
		id: string;
		email: string;
	};
};
