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
	addEventListeners(): void {
		const form = document.getElementById("register-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
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
					{ user: { email: input.data.email } },
				);
			});
		}
	}

	render(): string {
		return `
      <div>
        ${new SectionTitle().render({ text: "アカウントを作成" })}
        <div class="max-w-md mx-auto">
          <form id="register-form" novalidate class="space-y-6">
            ${new FormInput().render({
							id: "email",
							name: "email",
							type: "email",
							autocomplete: "email",
							labelText: "メールアドレス",
						})}
            <div class="flex justify-center">
              ${new Button().render({
								width: "full",
								type: "submit",
								text: "登録",
							})}
            </div>
          </form>
        </div>
      </div>
    `;
	}
}
