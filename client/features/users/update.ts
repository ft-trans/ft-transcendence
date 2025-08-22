import {
	type UpdateUserRequest,
	type UpdateUserResponse,
	updateUserFormSchema,
} from "@shared/api/users";
import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	SectionTitle,
} from "client/components";
import { annotateZodErrors } from "client/components/form/error";

export class UpdateUser extends Component {
	addEventListeners(): void {
		const form = document.getElementById("update-user-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
				};

				const input = updateUserFormSchema.safeParse(rawData);
				if (!input.success) {
					annotateZodErrors(input.error);
					new FloatingBanner({
						message: "入力に誤りがあります",
						type: "error",
					}).show();
					return;
				}
				// TODO: APIエラーのハンドリング
				await new ApiClient().put<UpdateUserRequest, UpdateUserResponse>(
					"/api/users/me",
					{ user: { email: input.data.email } },
				);
			});
		}
	}

	render(): string {
		return `
<div>
    ${new SectionTitle({ text: "アカウントを編集" }).render()}
    <div class="max-w-md mx-auto">
        <form id="update-user-form" novalidate class="space-y-6">
            ${new FormInput({
							id: "email",
							name: "email",
							type: "email",
							autocomplete: "email",
							labelText: "メールアドレス",
						}).render()}
            <div class="flex justify-center">
                ${new Button({
									width: "full",
									type: "submit",
									text: "更新",
								}).render()}
            </div>
        </form>
    </div>
</div>
`;
	}
}
