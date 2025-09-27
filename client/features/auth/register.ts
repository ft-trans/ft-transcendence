import {
	type RegisterUserRequest,
	type RegisterUserResponse,
	registerUserFormSchema,
} from "@shared/api/auth";
import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	SectionTitle,
} from "client/components";
import { annotateZodErrors } from "client/components/form/error";

export class Register extends Component {
	onLoad(): void {
		const form = document.getElementById("register-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
					username: formData.get("username"),
					password: formData.get("password"),
					passwordConfirm: formData.get("passwordConfirm"),
				};

				const input = registerUserFormSchema.safeParse(rawData);
				if (!input.success) {
					annotateZodErrors(input.error);
					new FloatingBanner({
						message: "入力に誤りがあります",
						type: "error",
					}).show();
					return;
				}
				// TODO: APIエラーのハンドリング
				await new ApiClient().post<RegisterUserRequest, RegisterUserResponse>(
					"/api/auth/register",
					{
						user: {
							email: input.data.email,
							username: input.data.username,
							password: input.data.password,
						},
					},
				);
			});
		}
	}

	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "アカウントを作成" }).render()}
        <div class="max-w-md mx-auto">
          <form id="register-form" novalidate class="space-y-6">
            ${new FormInput({
							id: "email",
							name: "email",
							type: "email",
							autocomplete: "email",
							labelText: "メールアドレス",
						}).render()}
            ${new FormInput({
							id: "username",
							name: "username",
							type: "text",
							autocomplete: "username",
							labelText: "ユーザー名",
						}).render()}
            ${new FormInput({
							id: "password",
							name: "password",
							type: "password",
							labelText: "パスワード",
						}).render()}
            ${new FormInput({
							id: "passwordConfirm",
							name: "passwordConfirm",
							type: "password",
							labelText: "パスワード確認",
						}).render()}
            <div class="flex justify-center">
              ${new Button({
								width: "full",
								type: "submit",
								text: "登録",
							}).render()}
            </div>
          </form>
        </div>
      </div>
    `;
	}
}
