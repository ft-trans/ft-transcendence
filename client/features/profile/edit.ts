import {
	type GetProfileResponse,
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
	private currentUser: GetProfileResponse["user"] | null = null;

	async onLoad(): Promise<void> {
		// 現在のユーザー情報を取得
		try {
			const response = await new ApiClient().get<GetProfileResponse>(
				"/api/profile",
			);
			this.currentUser = response.user;
			this.populateForm();
		} catch (error) {
			console.error("Failed to load user profile:", error);
			new FloatingBanner({
				message: "プロフィール情報の読み込みに失敗しました",
				type: "error",
			}).show();
		}

		const form = document.getElementById("profile-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					email: formData.get("email"),
					username: formData.get("username"),
					avatar: formData.get("avatar"),
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
					{
						user: {
							email: input.data.email,
							username: input.data.username,
							avatar: input.data.avatar,
						},
					},
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

	private populateForm(): void {
		if (!this.currentUser) return;

		const emailInput = document.getElementById("email") as HTMLInputElement;
		const usernameInput = document.getElementById(
			"username",
		) as HTMLInputElement;
		const avatarInput = document.getElementById("avatar") as HTMLInputElement;

		if (emailInput) emailInput.value = this.currentUser.email || "";
		if (usernameInput) usernameInput.value = this.currentUser.username || "";
		if (avatarInput) avatarInput.value = this.currentUser.avatar || "";
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
            ${new FormInput({
							id: "username",
							name: "username",
							type: "text",
							autocomplete: "username",
							labelText: "ユーザー名",
						}).render()}
            ${new FormInput({
							id: "avatar",
							name: "avatar",
							type: "url",
							labelText: "アバターURL",
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
