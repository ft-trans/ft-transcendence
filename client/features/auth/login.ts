import type { LoginUserRequest, LoginUserResponse } from "@shared/api/auth";
import { loginUserFormSchema } from "@shared/api/auth";
import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	SectionTitle,
} from "client/components";
import { annotateZodErrors } from "client/components/form/error";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";

export class Login extends Component {
	onLoad(): void {
		const form = document.getElementById("login-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
					password: formData.get("password"),
				};

				const input = loginUserFormSchema.safeParse(rawData);
				if (!input.success) {
					annotateZodErrors(input.error);
					new FloatingBanner({
						message: "入力に誤りがあります",
						type: "error",
					}).show();
					return;
				}

				try {
					const response = await new ApiClient().post<
						LoginUserRequest,
						LoginUserResponse
					>("/api/auth/login", {
						user: { email: input.data.email, password: input.data.password },
					});

					if (response.user) {
						authStore.setUser({
							id: response.user.id,
							email: response.user.email,
						});
						new FloatingBanner({
							message: "ログインしました",
							type: "info",
						}).show();
						setTimeout(() => {
							navigateTo("/");
						}, 1000);
					}
				} catch (error) {
					console.error("Login failed:", error);
					new FloatingBanner({
						message: "ログインに失敗しました",
						type: "error",
					}).show();
				}
			});
		}
	}

	render(): string {
		return `
      <div>
        ${new SectionTitle({ text: "ログイン" }).render()}
        <div class="max-w-md mx-auto">
          <form id="login-form" novalidate class="space-y-6">
            ${new FormInput({
							id: "email",
							name: "email",
							type: "email",
							autocomplete: "email",
							labelText: "メールアドレス",
						}).render()}
            ${new FormInput({
							id: "password",
							name: "password",
							type: "password",
							autocomplete: "current-password",
							labelText: "パスワード",
						}).render()}
            <div class="flex justify-center">
              ${new Button({
								width: "full",
								type: "submit",
								text: "ログイン",
							}).render()}
            </div>
          </form>
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              アカウントをお持ちでない方は
              <a href="/auth/register" data-link class="text-blue-600 hover:text-blue-800 underline">
                新規登録
              </a>
            </p>
          </div>
        </div>
      </div>
    `;
	}
}
