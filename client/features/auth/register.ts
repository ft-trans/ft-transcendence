import { registerUserFormSchema } from "@shared/api/auth";
import { ApiClient } from "client/api/api_client";
import { Button, Component, FormInput, SectionTitle } from "client/components";

export class Register extends Component {
	addEventListeners(): void {
		const form = document.getElementById("register-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					user: {
						email: formData.get("email"),
					},
				};

				// TODO: バリデーションエラーのハンドリング
				const input = registerUserFormSchema.safeParse(rawData);
				// TODO: APIエラーのハンドリング
				await new ApiClient().post("/api/auth/register", input.data);
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
