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
					password: formData.get("password"),
					passwordConfirm: formData.get("passwordConfirm"),
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

				try {
					// Profile update (email, username)
					await new ApiClient().put<
						UpdateProfileRequest,
						UpdateProfileResponse
					>("/api/profile", {
						user: {
							email: input.data.email,
							username: input.data.username,
							password: input.data.password,
							passwordConfirm: input.data.passwordConfirm,
						},
					});

					// Avatar upload (if file is selected)
					const avatarFile = formData.get("avatar-file") as File;
					if (avatarFile && avatarFile.size > 0) {
						const avatarFormData = new FormData();
						avatarFormData.append("file", avatarFile);

						await new ApiClient().postFormData(
							"/api/profile/avatar",
							avatarFormData,
						);
					}

					new FloatingBanner({
						message: "プロフィールを更新しました",
						type: "success",
					}).show();

					// Reload profile data
					setTimeout(() => {
						window.location.reload();
					}, 1000);
				} catch (error) {
					console.error("Profile update failed:", error);
					new FloatingBanner({
						message: "プロフィールの更新に失敗しました",
						type: "error",
					}).show();
				}
			});
		}

		// File preview functionality
		const avatarFileInput = document.getElementById(
			"avatar-file",
		) as HTMLInputElement;
		if (avatarFileInput) {
			avatarFileInput.addEventListener("change", (event) => {
				const file = (event.target as HTMLInputElement).files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						const previewDiv = document.getElementById("new-avatar-preview");
						const previewImage = document.getElementById(
							"preview-image",
						) as HTMLImageElement;

						if (previewDiv && previewImage) {
							previewImage.src = e.target?.result as string;
							previewDiv.classList.remove("hidden");
							previewDiv.classList.add("flex");
						}
						const currentPreviewDiv = document.getElementById(
							"current-avatar-preview",
						);
						if (currentPreviewDiv) {
							currentPreviewDiv.classList.add("hidden");
						}
					};
					reader.readAsDataURL(file);
				}
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

		if (emailInput) emailInput.value = this.currentUser.email || "";
		if (usernameInput) usernameInput.value = this.currentUser.username || "";

		// Update current avatar preview
		this.updateCurrentAvatarPreview();
	}

	private updateCurrentAvatarPreview(): void {
		const currentAvatarPreview = document.getElementById(
			"current-avatar-preview",
		);
		if (currentAvatarPreview && this.currentUser) {
			// 現在のアバター画像を表示
			const defaultAvatar = "/avatars/default.svg";
			let currentAvatarUrl = defaultAvatar;
			if (this.currentUser.avatar?.trim()) {
				currentAvatarUrl = this.currentUser.avatar.startsWith("/avatars/")
					? this.currentUser.avatar
					: `/avatars/${this.currentUser.avatar}`;
			}
			currentAvatarPreview.innerHTML = `<img src="${currentAvatarUrl}" alt="現在のアバター" class="w-20 h-20 rounded-full object-cover" onerror="this.src='${defaultAvatar}'">`;
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
            <div class="space-y-2">
                <label for="avatar-file" class="block text-sm font-medium text-gray-700">アバター画像</label>
                <div id="current-avatar-preview" class="flex justify-center mb-4">
                    ${
											this.currentUser?.avatar
												? `<img src="${this.currentUser.avatar}" alt="Current Avatar" class="w-20 h-20 rounded-full object-cover">`
												: `<div class="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                             <span class="text-gray-500 text-sm">画像なし</span>
                           </div>`
										}
                </div>
                <div id="new-avatar-preview" class="hidden justify-center mb-4">
                    <img id="preview-image" src="" alt="Preview" class="w-20 h-20 rounded-full object-cover">
                </div>
                <input
                    id="avatar-file"
                    name="avatar-file"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p class="text-xs text-gray-500">JPEG、PNG、GIF、WebP形式、5MB以下</p>
            </div>
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
