import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	Link,
	SectionTitle,
} from "client/components";
import { annotateZodErrors } from "client/components/form/error";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";
import {
	type CreateTournamentRequest,
	type CreateTournamentResponse,
	createTournamentFormSchema,
	type GetTournamentsResponse,
} from "shared/api/tournament";

export class ListTournament extends Component {
	private readonly apiClient: ApiClient;

	constructor() {
		super();
		this.apiClient = new ApiClient();
	}

	async onLoad(): Promise<void> {
		const state = authStore.getState();
		if (!state.isAuthenticated) {
			navigateTo("/auth/login");
			return;
		}
		const maxParticipantsInput = document.getElementById("maxParticipants");
		if (
			maxParticipantsInput &&
			maxParticipantsInput instanceof HTMLInputElement
		) {
			// デフォルト値を4に設定
			maxParticipantsInput.value = "4";
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
						console.log("Tournament created:", response.tournament);
						navigateTo(`/tournaments/${response.tournament.id}/`);
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

		// トーナメント一覧の表示
		const listContainer = document.getElementById("tournament-list");
		if (listContainer) {
			listContainer.innerHTML = await this.renderList();
		}
	}

	render(): string {
		return `
        <div class="max-w-lx mx-auto">
	        ${new SectionTitle({ text: "トーナメント作成" }).render()}
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4 mb-6">
				${this.renderNewForm()}
			</div>
	        ${new SectionTitle({ text: "トーナメント一覧" }).render()}
			<div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4" id="tournament-list">

			</div>
        </div>
        `;
	}

	private renderNewForm(): string {
		return `
		<form id="tournament-form" novalidate class="space-y-6">
			<div class="hidden">
				${
					// 簡単のため4人で固定(hidden)
					new FormInput({
						id: "maxParticipants",
						name: "maxParticipants",
						type: "number",
						labelText: "人数",
					}).render()
				}
			</div>
			<div class="flex justify-center">
				${new Button({
					width: "full",
					type: "submit",
					text: "トーナメント新規作成",
				}).render()}
			</div>
		</form>
		`;
	}

	private async renderList(): Promise<string> {
		const tournaments =
			await this.apiClient.get<GetTournamentsResponse>(`/api/tournaments`);
		if (!tournaments.tournaments.length) {
			return `<p>現在開催中のトーナメントはありません。</p>`;
		}
		return `
		<div>
			${tournaments.tournaments.map((tournament) => this.renderListItem(tournament)).join("")}
		</div>
		`;
	}

	private renderListItem(
		tournament: GetTournamentsResponse["tournaments"][number],
	): string {
		return `
		<div class="border-b border-gray-300 py-4 flex  items-center">
			<div>
				${new Link({
					href: `/tournaments/${tournament.id}/`,
					text: "詳細",
				}).render()}
			</div>
			<div class="ml-4 font-medium">
				${tournament.status}
			</div>
			<div class="ml-4">
				<img
					src="${tournament.organizer.avatarUrl || "/avatars/default.svg"}"
					alt="Organizer Avatar"
					class="w-12 h-12 rounded-full object-cover"
				/>
			</div>
			<div class="ml-4">
				<div class="text-xs text-gray-600 mb-1">
					トーナメントID: ${tournament.id}
				</div>
				<div class="text-xs mb-1">
					最大参加者数: ${tournament.maxParticipants}
				</div>
				<div>主催者: ${tournament.organizer.username}</div>
			</div>
		</div>
		`;
	}
}
