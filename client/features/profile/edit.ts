import {
	type UpdateProfileRequest,
	type UpdateProfileResponse,
	updateProfileFormSchema,
} from "@shared/api/profile";
import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	SectionTitle,
} from "client/components";
import { annotateZodErrors } from "client/components/form/error";

export class EditProfile extends Component {
	onLoad(): void {
		const form = document.getElementById("profile-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
				};

				const input = updateProfileFormSchema.safeParse(rawData);
				if (!input.success) {
					annotateZodErrors(input.error);
					new FloatingBanner({
						message: "入力に誤りがあります",
						type: "error",
					}).show();
					return;
				}
				// TODO: APIエラーのハンドリング
				await new ApiClient().put<UpdateProfileRequest, UpdateProfileResponse>(
					"/api/profile",
					{ user: { email: input.data.email } },
				);
			});
		}

		const deleteButton = document.getElementById("delete-button");
		if (deleteButton && deleteButton instanceof HTMLButtonElement) {
			deleteButton.addEventListener("click", async () => {
				if (confirm("本当に退会しますか？この操作は取り消せません。")) {
					// TODO: APIエラーのハンドリング
					await new ApiClient().delete("/api/profile");
				}
			});
		}
	}

	render(): string {
		return `
<div>
    ${new SectionTitle({ text: "アカウントを編集" }).render()}
    <div class="max-w-md mx-auto">
        <form id="profile-form" novalidate class="space-y-6">
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
		<div class="flex justify-center mt-20">
			${new Button({
				id: "delete-button",
				width: "full",
				type: "button",
				color: "red",
				text: "退会",
			}).render()}
		</div>
	</div>
</div>
`;
	}
}
