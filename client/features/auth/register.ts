import { registerUserFormSchema } from "@shared/api/auth";
import {
	Button,
	Component,
	FormInput,
	Header,
	SectionTitle,
} from "client/components";

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

				const input = registerUserFormSchema.safeParse(rawData);
				console.log("Register input:", input);
			});
		}
	}

	render(): string {
		return `
      <div class="min-h-screen">
        ${new Header().render()}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </main>
      </div>
    `;
	}
}
