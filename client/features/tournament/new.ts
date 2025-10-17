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
import {
	type CreateTournamentRequest,
	type CreateTournamentResponse,
	createTournamentFormSchema,
} from "shared/api/tournament";

export class NewTournament extends Component {
	async onLoad(): Promise<void> {
		const maxParticipantsInput = document.getElementById("maxParticipants");
		if (
			maxParticipantsInput &&
			maxParticipantsInput instanceof HTMLInputElement
		) {
			maxParticipantsInput.value = "4"; // デフォルト値を4に設定
		}
		const form = document.getElementById("tournament-form");
		if (form && form instanceof HTMLFormElement) {
			form.addEventListener("submit", async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				const rawData = {
					maxParticipants: Number(formData.get("maxParticipants")),
				};
				const input = createTournamentFormSchema.safeParse(rawData);
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
						CreateTournamentRequest,
						CreateTournamentResponse
					>("/api/tournaments", {
						tournament: {
							maxParticipants: input.data.maxParticipants,
						},
					});

					if (response.tournament) {
						new FloatingBanner({
							message: "トーナメントが作成されました",
							type: "info",
						}).show();
						navigateTo("/");
					}
				} catch (error) {
					console.error("Create tournament failed:", error);
					new FloatingBanner({
						message: "トーナメントの作成に失敗しました",
						type: "error",
					}).show();
				}
			});
		}
	}

	render(): string {
		return `
        ${new SectionTitle({ text: "トーナメント作成" }).render()}
        <div class="max-w-md mx-auto">
            <form id="tournament-form" novalidate class="space-y-6">
                ${new FormInput({
									id: "maxParticipants",
									name: "maxParticipants",
									type: "number",
									labelText: "人数",
								}).render()}
                <div class="flex justify-center">
                    ${new Button({
											width: "full",
											type: "submit",
											text: "作成",
										}).render()}
                </div>
            </form>
        </div>
        `;
	}
}
