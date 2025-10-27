import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";
import type {
	GetTournamentResponse,
	RegisterTournamentResponse,
	StartTournamentResponse,
} from "shared/api/tournament";

export class ShowTournament extends Component {
	private apiClient: ApiClient;
	private userId: string | undefined = undefined;

	constructor() {
		super();
		this.apiClient = new ApiClient();
		const state = authStore.getState();
		this.userId = state.user?.id;
	}

	async onLoad(params: RouteParams): Promise<void> {
		const state = authStore.getState();
		if (!state.isAuthenticated) {
			navigateTo("/auth/login");
			return;
		}
		const tournamentId = params.tournamentId;

		try {
			const tournament = await this.apiClient.get<GetTournamentResponse>(
				`/api/tournaments/${tournamentId}`,
			);

			this.addEventRegisterButton(tournamentId);
			this.addEventUnregisterButton(tournamentId);
			this.addEventStartTournamentButton(tournamentId);

			// participantsが存在するかチェック
			const participants = tournament.tournament?.participants || [];
			// 自分が参加者に含まれているかチェック
			const isRegistered = participants.some((p) => p.userId === this.userId);
			this.toggleRegisterButtons(isRegistered);

			this.displayRegisterButtonsArea(tournament);
			this.displayStartButton(tournament);

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
			<div id="register-buttons-area" class="mt-4">
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
			<div class="mt-4">
				<div id="start-button-div" class="hidden">
					${new Button({
						id: "start-button",
						text: "トーナメントを開始する",
						color: "blue",
					}).render()}
				</div>
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
					{ tournamentId: string },
					RegisterTournamentResponse
				>(`/api/tournaments/${tournamentId}/register`, {
					tournamentId,
				});
				if (!response.participant) {
					throw new Error("Failed to register participant");
				}
				new FloatingBanner({
					message: "トーナメントに参加しました",
					type: "info",
				}).show();
				this.toggleRegisterButtons(true);
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
				const response =
					await new ApiClient().delete<RegisterTournamentResponse>(
						`/api/tournaments/${tournamentId}/register`,
					);
				if (!response.participant) {
					throw new Error("Failed to unregister participant");
				}
				new FloatingBanner({
					message: "トーナメントから離脱しました",
					type: "info",
				}).show();
				this.toggleRegisterButtons(false);
				this.renderDebugDiv(tournamentId);
			} catch (_error) {
				new FloatingBanner({
					message: "トーナメント離脱に失敗しました",
					type: "error",
				}).show();
			}
		});
	}

	private addEventStartTournamentButton(tournamentId: string): void {
		const button = document.getElementById("start-button");
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
					{ tournamentId: string },
					StartTournamentResponse
				>(`/api/tournaments/${tournamentId}/start`, {
					tournamentId,
				});
				if (!response.tournament) {
					throw new Error("Failed to start tournament");
				}
				console.log("Tournament started:", response);
				new FloatingBanner({
					message: "トーナメントを開始しました",
					type: "info",
				}).show();

				this.renderDebugDiv(tournamentId);
			} catch (_error) {
				new FloatingBanner({
					message: "トーナメントの開始に失敗しました",
					type: "error",
				}).show();
			}
		});
	}

	private toggleRegisterButtons(isRegistered: boolean): void {
		const registerDiv = document.getElementById("register-button-div");
		if (registerDiv) {
			registerDiv.classList.toggle("hidden", isRegistered);
		}

		const unregisterDiv = document.getElementById("unregister-button-div");
		if (unregisterDiv) {
			unregisterDiv.classList.toggle("hidden", !isRegistered);
		}
	}

	private displayRegisterButtonsArea(tournament: GetTournamentResponse): void {
		const registerDiv = document.getElementById("register-buttons-area");
		if (!registerDiv) {
			return;
		}
		if (tournament.tournament.status === "registration") {
			registerDiv.classList.remove("hidden");
		} else {
			registerDiv.classList.add("hidden");
		}
	}

	private displayStartButton(tournament: GetTournamentResponse): void {
		const startDiv = document.getElementById("start-button-div");
		if (!startDiv) {
			return;
		}
		if (tournament.tournament.organizerId !== this.userId) {
			startDiv.innerHTML = `
			<div class="text-sm text-gray-600">
				参加者が揃いました。主催者がトーナメントを開始するまでお待ちください。
			</div>`;
		}
		if (
			tournament.tournament.participants.length ===
				tournament.tournament.maxParticipants &&
			tournament.tournament.status === "registration"
		) {
			startDiv.classList.remove("hidden");
		} else {
			startDiv.classList.add("hidden");
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
		this.toggleRegisterButtons(isRegistered);
		this.displayRegisterButtonsArea(tournament);
		this.displayStartButton(tournament);

		const e = document.getElementById("debug-id");
		if (!e) {
			return;
		}
		const participantNames =
			participants.length > 0
				? participants.map((p) => p.username).join(", ")
				: "参加者なし";

		e.innerHTML = `
		<div class="mt-4 p-4 border rounded-lg bg-gray-50">
			<div>トーナメントデバッグ情報 (実装中)</div>
			<div>トーナメントID: ${tournamentId}</div>
			<div>最大参加者数: ${tournament.tournament?.maxParticipants || "不明"}</div>
			<div>参加者数: ${participants.length}</div>
			<div>参加者: ${participantNames}</div>
			<div>ステータス: ${tournament.tournament?.status || "不明"}</div>
		</div>
		`;
	}
}
