import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	FormInput,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";
import type {
	GetTournamentResponse,
	RegisterTournamentRequest,
	RegisterTournamentResponse,
} from "shared/api/tournament";
import { is } from "zod/v4/locales";

export class ShowTournament extends Component {
	private apiClient: ApiClient;
	private isRegistered: boolean = false;
	private userId: string | undefined = undefined;

	constructor() {
		super();
		this.apiClient = new ApiClient();
		const state = authStore.getState();
		this.userId = state.user?.id;
	}

	async onLoad(params: RouteParams): Promise<void> {
		const tournamentId = params.tournamentId;

		try {
			const tournament = await this.apiClient.get<GetTournamentResponse>(
				`/api/tournaments/${tournamentId}`,
			);

			this.addEventRegisterButton(tournamentId);
			this.addEventUnregisterButton(tournamentId);

			// participantsが存在するかチェック
			const participants = tournament.tournament?.participants || [];
			// 自分が参加者に含まれているかチェック
			const isRegistered = participants.some((p) => p.userId === this.userId);
			this.setIsRegistered(isRegistered);

			this.renderDebugDiv(tournamentId);
		} catch (_error) {
			new FloatingBanner({
				message: "トーナメントが見つかりませんでした",
				type: "error",
			}).show();
			// TODO 404ページにリダイレクト
			navigateTo("/");
		}
	}

	render(): string {
		return `
        ${new SectionTitle({ text: "トーナメント" }).render()}
        <div class="max-w-md mx-auto">
			<p id="debug-id">トーナメント詳細ページ (実装中)</p>
			<div id="register-button-div" class="hidden">
				${new Button({
					id: "register-button",
					text: "参加する",
					color: "blue",
				}).render()}
			</div>
			<div id="unregister-button-div" class="hidden">
				${new Button({
					id: "unregister-button",
					text: "離脱する",
					color: "gray",
				}).render()}
			</div>
        </div>
        `;
	}

	private addEventRegisterButton(tournamentId: string): void {
		const button = document.getElementById("register-button");
		if (!button) {
			return;
		}
		button.addEventListener("click", async () => {
			try {
				if (!this.userId) {
					new FloatingBanner({
						message: "ログインしてください",
						type: "info",
					}).show();
					return;
				}
				const response = await new ApiClient().post<
					RegisterTournamentRequest,
					RegisterTournamentResponse
				>(`/api/tournaments/${tournamentId}/register`, {
					tournamentId,
					userId: this.userId,
				});
				if (!response.participant) {
					throw new Error("Failed to register participant");
				}
				new FloatingBanner({
					message: "トーナメントに参加しました",
					type: "info",
				}).show();
				this.setIsRegistered(true);
				this.renderDebugDiv(tournamentId);
			} catch (_error) {
				new FloatingBanner({
					message: "トーナメント参加に失敗しました",
					type: "error",
				}).show();
			}
		});
	}

	private addEventUnregisterButton(tournamentId: string): void {
		const button = document.getElementById("unregister-button");
		if (!button) {
			return;
		}
		button.addEventListener("click", async () => {
			try {
				if (!this.userId) {
					new FloatingBanner({
						message: "ログインしてください",
						type: "info",
					}).show();
					return;
				}
				await new ApiClient().delete(
					`/api/tournaments/${tournamentId}/register`,
				);
				new FloatingBanner({
					message: "トーナメントから離脱しました",
					type: "info",
				}).show();
				this.setIsRegistered(false);
				this.renderDebugDiv(tournamentId);
			} catch (_error) {
				new FloatingBanner({
					message: "トーナメント離脱に失敗しました",
					type: "error",
				}).show();
			}
		});
	}

	private setIsRegistered(isRegistered: boolean): void {
		this.isRegistered = isRegistered;
		const registerDiv = document.getElementById("register-button-div");
		if (registerDiv) {
			registerDiv.classList.toggle("hidden", isRegistered);
		}

		const unregisterDiv = document.getElementById("unregister-button-div");
		if (unregisterDiv) {
			unregisterDiv.classList.toggle("hidden", !isRegistered);
		}
	}

	private async renderDebugDiv(tournamentId: string): Promise<void> {
		const tournament = await this.apiClient.get<GetTournamentResponse>(
			`/api/tournaments/${tournamentId}`,
		);

		// participantsが存在するかチェック
		const participants = tournament.tournament?.participants || [];
		// 自分が参加者に含まれているか
		const isRegistered = participants.some((p) => p.userId === this.userId);
		this.setIsRegistered(isRegistered);

		const e = document.getElementById("debug-id");
		if (!e) {
			return;
		}
		const participantNames =
			participants.length > 0
				? participants.map((p) => p.username).join(", ")
				: "参加者なし";

		e.innerHTML = `<div>トーナメント詳細ページ (実装中) - ${tournamentId}</div>
			<div>
				最大参加者数: ${tournament.tournament?.maxParticipants || "不明"}
				参加者数: ${participants.length}
				参加者: ${participantNames}
			</div>
			`;
	}
}
