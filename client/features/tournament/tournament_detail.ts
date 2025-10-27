import type {
	TournamentDetailDTO,
	TournamentMatchDTO,
	TournamentParticipantDTO,
	TournamentRoundDTO,
	TournamentStatus,
} from "@shared/api/tournament";
import {
	getTournamentDetail,
	registerTournament,
	startTournament,
	startTournamentMatch,
	unregisterTournament,
} from "client/api/tournament";
import {
	Component,
	FloatingBanner,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { navigateTo } from "client/router";
import { authStore } from "client/store/auth_store";

type ViewState =
	| { phase: "loading" }
	| { phase: "loaded"; tournament: TournamentDetailDTO }
	| { phase: "error"; error: string };

export class TournamentDetail extends Component {
	private state: ViewState = { phase: "loading" };
	private tournamentId: string | null = null;
	private ws: WebSocket | null = null;

	render(): string {
		return `
      <div id="tournament-detail-root">
        ${this.inner()}
      </div>
    `;
	}

	onLoad(params?: RouteParams): void {
		if (!params?.id) {
			this.setState({
				phase: "error",
				error: "トーナメントIDが指定されていません",
			});
			return;
		}

		this.tournamentId = params.id;
		void this.loadTournament();
		this.connectWebSocket();
		this.attachEventListeners();
	}

	private async loadTournament(): Promise<void> {
		if (!this.tournamentId) return;

		try {
			this.setState({ phase: "loading" });
			const tournament = await getTournamentDetail(this.tournamentId);
			this.setState({ phase: "loaded", tournament });
		} catch (error) {
			console.error("Failed to load tournament:", error);
			this.setState({
				phase: "error",
				error: "トーナメントの取得に失敗しました",
			});
		}
	}

	private connectWebSocket(): void {
		if (!this.tournamentId) return;

		const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/tournaments`;
		this.ws = new WebSocket(wsUrl);

		this.ws.addEventListener("open", () => {
			console.log("Tournament WebSocket connected");
			// トーナメントを購読
			this.ws?.send(
				JSON.stringify({
					type: "subscribe",
					payload: { tournamentId: this.tournamentId },
				}),
			);
		});

		this.ws.addEventListener("message", (event) => {
			try {
				const message = JSON.parse(event.data);
				console.log("Tournament WebSocket message:", message);

				// 試合開始イベントの場合、参加者なら自動遷移
				if (message.type === "tournament.match_started") {
					const currentUserId = authStore.getState().user?.id;
					console.log("Current user ID:", currentUserId);
					console.log(
						"Match participants:",
						message.payload.match.participants,
					);

					const isParticipant = message.payload.match.participants.some(
						(p: { userId: string }) => p.userId === currentUserId,
					);

					console.log("Is participant?", isParticipant);

					if (isParticipant) {
						// 参加者の場合、試合画面に遷移（トーナメントIDをクエリパラメータで渡す）
						console.log("Navigating to match:", message.payload.matchId);
						navigateTo(
							`/pong/matches/${message.payload.matchId}?tournamentId=${this.tournamentId}`,
						);
						return;
					}
				}

				// イベントを受信したらトーナメント情報を再取得
				void this.loadTournament();
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		});

		this.ws.addEventListener("close", () => {
			console.log("Tournament WebSocket disconnected");
		});

		this.ws.addEventListener("error", (error) => {
			console.error("Tournament WebSocket error:", error);
		});
	}

	private attachEventListeners(): void {
		// イベント委譲を使用して、ルート要素に1回だけリスナーを登録
		const root = document.getElementById("tournament-detail-root");
		if (!root) return;

		root.addEventListener("click", (event) => {
			const target = event.target as HTMLElement;

			// 参加ボタン
			if (target.id === "register-btn" || target.closest("#register-btn")) {
				void this.handleRegister();
				return;
			}

			// 参加取消ボタン
			if (target.id === "unregister-btn" || target.closest("#unregister-btn")) {
				void this.handleUnregister();
				return;
			}

			// トーナメント開始ボタン
			if (
				target.id === "start-tournament-btn" ||
				target.closest("#start-tournament-btn")
			) {
				void this.handleStartTournament();
				return;
			}

			// 試合開始ボタン
			const matchBtn = target.closest("[data-match-id]") as HTMLElement;
			if (matchBtn) {
				const matchId = matchBtn.dataset.matchId;
				if (matchId) {
					void this.handleStartMatch(matchId);
				}
				return;
			}
		});
	}

	private async handleRegister(): Promise<void> {
		if (!this.tournamentId) return;

		try {
			await registerTournament(this.tournamentId);
			void this.loadTournament();
			new FloatingBanner({
				message: "トーナメントに参加しました",
				type: "success",
			});
		} catch (error) {
			console.error("Failed to register:", error);
			new FloatingBanner({
				message:
					error instanceof Error ? error.message : "参加登録に失敗しました",
				type: "error",
			});
		}
	}

	private async handleUnregister(): Promise<void> {
		if (!this.tournamentId) return;

		if (!confirm("参加を取り消しますか?")) return;

		try {
			await unregisterTournament(this.tournamentId);
			void this.loadTournament();
			new FloatingBanner({
				message: "参加を取り消しました",
				type: "success",
			});
		} catch (error) {
			console.error("Failed to unregister:", error);
			new FloatingBanner({
				message:
					error instanceof Error ? error.message : "参加取消に失敗しました",
				type: "error",
			});
		}
	}

	private async handleStartTournament(): Promise<void> {
		if (!this.tournamentId) return;

		if (!confirm("トーナメントを開始しますか？")) return;

		try {
			await startTournament(this.tournamentId);
			void this.loadTournament();
			new FloatingBanner({
				message: "トーナメントを開始しました",
				type: "success",
			});
		} catch (error) {
			console.error("Failed to start tournament:", error);
			new FloatingBanner({
				message:
					error instanceof Error
						? error.message
						: "トーナメント開始に失敗しました",
				type: "error",
			});
		}
	}

	private async handleStartMatch(matchId: string): Promise<void> {
		if (!this.tournamentId) return;

		try {
			console.log("Starting tournament match:", matchId);
			await startTournamentMatch(this.tournamentId, matchId);
			console.log(
				"Tournament match started successfully, waiting for WebSocket event...",
			);
			// WebSocketイベントで画面遷移するため、ここでは遷移しない
			new FloatingBanner({
				message: "試合を開始しました。まもなく試合画面に移動します...",
				type: "success",
			});
		} catch (error) {
			console.error("Failed to start match:", error);
			new FloatingBanner({
				message:
					error instanceof Error ? error.message : "試合開始に失敗しました",
				type: "error",
			});
		}
	}

	private setState(next: ViewState): void {
		// WebSocketはクリーンアップしない（詳細ページにいる限り接続を維持）
		this.state = next;
		const host = document.querySelector<HTMLElement>("#tournament-detail-root");
		if (host) {
			host.innerHTML = this.inner();
			// イベントリスナーは onLoad で1回だけ登録されているので、ここでは再登録しない
		}
	}

	private inner(): string {
		const { phase } = this.state;

		if (phase === "loading") {
			return `
        <div class="text-center py-8">
          <p class="text-gray-600">読み込み中...</p>
        </div>
      `;
		}

		if (phase === "error") {
			return `
        <div class="text-center py-8">
          <p class="text-red-600">${this.state.error}</p>
          <a href="/tournaments" data-link class="text-blue-600 hover:underline mt-4 inline-block">
            トーナメント一覧に戻る
          </a>
        </div>
      `;
		}

		const { tournament } = this.state;
		const currentUser = authStore.getState().user;
		const isOrganizer = currentUser?.id === tournament.organizerId;
		const isParticipant = tournament.participants.some(
			(p) => p.userId === currentUser?.id,
		);

		return `
      <div class="max-w-6xl mx-auto">
        ${new SectionTitle({ text: tournament.name }).render()}

        <!-- 基本情報 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <img
                  src="${tournament.organizer.avatar}"
                  alt="${tournament.organizer.username}"
                  class="w-8 h-8 rounded-full"
                />
                <span class="text-gray-600">主催: ${tournament.organizer.username}</span>
              </div>
              ${tournament.description ? `<p class="text-gray-700 mt-2">${tournament.description}</p>` : ""}
            </div>

            <span class="px-4 py-2 rounded-full text-sm font-semibold ${this.getStatusColor(tournament.status)}">
              ${this.getStatusLabel(tournament.status)}
            </span>
          </div>

          <div class="flex gap-6 text-sm text-gray-600">
            <span>参加者: ${tournament.participantCount}/${tournament.maxParticipants}</span>
            <span>作成日: ${new Date(tournament.createdAt).toLocaleDateString()}</span>
          </div>

          <!-- アクションボタン -->
          <div class="mt-6 flex gap-3">
            ${this.renderActionButtons(tournament, currentUser, isOrganizer, isParticipant)}
          </div>
        </div>

        <!-- トーナメント完了時の勝者表示 -->
        ${tournament.status === "completed" ? this.renderWinner(tournament) : ""}

        <!-- 参加者リスト -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-bold mb-4">参加者 (${tournament.participants.length}人)</h3>
          ${this.renderParticipantsList(tournament.participants)}
        </div>

        <!-- トーナメントブラケット -->
        ${tournament.rounds.length > 0 ? this.renderBracket(tournament) : ""}
      </div>
    `;
	}

	private renderWinner(tournament: TournamentDetailDTO): string {
		// 最終ラウンドの完了した試合から勝者を取得
		if (tournament.rounds.length === 0) return "";

		const finalRound = tournament.rounds.reduce((prev, current) =>
			prev.roundNumber > current.roundNumber ? prev : current,
		);

		const finalMatch = finalRound.matches.find((m) => m.status === "completed");
		if (!finalMatch || !finalMatch.winnerId) return "";

		const winner = finalMatch.participants.find(
			(p) => p.id === finalMatch.winnerId,
		);
		if (!winner) return "";

		return `
      <div class="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg shadow-lg p-8 mb-6 text-center">
        <div class="mb-4">
          <span class="text-6xl">🏆</span>
        </div>
        <h2 class="text-3xl font-bold text-yellow-800 mb-4">トーナメント優勝</h2>
        <div class="flex items-center justify-center gap-4 mb-2">
          <img
            src="${winner.user.avatar}"
            alt="${winner.user.username}"
            class="w-20 h-20 rounded-full border-4 border-yellow-400"
          />
          <span class="text-2xl font-bold text-yellow-900">${winner.user.username}</span>
        </div>
        <p class="text-yellow-700 mt-4">おめでとうございます！</p>
      </div>
    `;
	}

	private renderActionButtons(
		tournament: TournamentDetailDTO,
		currentUser:
			| { id: string; username?: string; email: string }
			| null
			| undefined,
		isOrganizer: boolean,
		isParticipant: boolean,
	): string {
		if (!currentUser) {
			return '<p class="text-gray-600">参加するにはログインしてください</p>';
		}

		if (tournament.status === "registration") {
			if (isOrganizer) {
				const canStart = tournament.participants.length >= 4;
				return `
          <button
            id="start-tournament-btn"
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            ${!canStart ? "disabled" : ""}
          >
            トーナメントを開始
          </button>
          ${!canStart ? '<span class="text-sm text-gray-600">※4人以上(主催者を含む)必要です</span>' : ""}
        `;
			}

			if (isParticipant) {
				return `
          <button
            id="unregister-btn"
            class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            参加を取り消す
          </button>
        `;
			}

			const isFull = tournament.participantCount >= tournament.maxParticipants;
			return `
        <button
          id="register-btn"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          ${isFull ? "disabled" : ""}
        >
          ${isFull ? "定員に達しました" : "参加する"}
        </button>
      `;
		}

		return "";
	}

	private renderParticipantsList(
		participants: TournamentParticipantDTO[],
	): string {
		if (participants.length === 0) {
			return '<p class="text-gray-500">参加者はまだいません</p>';
		}

		return `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${participants
					.map(
						(p) => `
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src="${p.user.avatar}"
              alt="${p.user.username}"
              class="w-10 h-10 rounded-full"
            />
            <div class="flex-1">
              <p class="font-medium">${p.user.username}</p>
              <p class="text-xs text-gray-500">${this.getParticipantStatusLabel(p.status)}</p>
            </div>
          </div>
        `,
					)
					.join("")}
      </div>
    `;
	}

	private renderBracket(tournament: TournamentDetailDTO): string {
		const sortedRounds = [...tournament.rounds].sort(
			(a, b) => a.roundNumber - b.roundNumber,
		);

		return `
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-bold mb-4">トーナメント表</h3>
        <div class="overflow-x-auto">
          <div class="flex gap-8 min-w-max">
            ${sortedRounds.map((round) => this.renderRound(round, tournament)).join("")}
          </div>
        </div>
      </div>
    `;
	}

	private renderRound(
		round: TournamentRoundDTO,
		tournament: TournamentDetailDTO,
	): string {
		const currentUser = authStore.getState().user;
		const isOrganizer = currentUser?.id === tournament.organizerId;

		return `
      <div class="flex-shrink-0" style="min-width: 280px;">
        <h4 class="font-bold text-center mb-4">
          ${round.roundNumber === 1 ? "1回戦" : round.roundNumber === 2 ? "2回戦" : round.roundNumber === 3 ? "準決勝" : tournament.rounds.length === round.roundNumber ? "決勝" : `ラウンド${round.roundNumber}`}
        </h4>
        <div class="space-y-4">
          ${round.matches.map((match) => this.renderMatch(match, tournament, isOrganizer)).join("")}
        </div>
      </div>
    `;
	}

	private renderMatch(
		match: TournamentMatchDTO,
		tournament: TournamentDetailDTO,
		isOrganizer: boolean,
	): string {
		// 参加者が不足している場合のエラーハンドリング
		if (!match.participants || match.participants.length < 2) {
			console.warn("Match participants not found:", match.id);
			return `
        <div class="border-2 border-gray-300 bg-gray-50 rounded-lg p-4">
          <p class="text-center text-sm text-gray-500">試合情報を読み込み中...</p>
        </div>
      `;
		}

		const player1 = match.participants[0];
		const player2 = match.participants[1];
		const currentUserId = authStore.getState().user?.id;
		const isMatchParticipant = match.participants.some(
			(p) => p.userId === currentUserId,
		);
		const isPending = match.status === "pending";
		const isInProgress = tournament.status === "in_progress";

		return `
      <div class="border-2 ${isMatchParticipant ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"} rounded-lg p-4">
        ${this.renderMatchPlayer(player1, match.winnerId)}
        <div class="flex items-center justify-center my-2">
          <span class="text-gray-500 font-bold text-sm">VS</span>
        </div>
        ${this.renderMatchPlayer(player2, match.winnerId)}

        ${
					isPending && isInProgress && isOrganizer
						? `
          <button
            data-match-id="${match.id}"
            class="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            試合を開始（主催者）
          </button>
        `
						: ""
				}

        ${
					isPending && isInProgress && !isOrganizer && isMatchParticipant
						? '<p class="mt-3 text-center text-sm text-gray-600">主催者が試合を開始するまでお待ちください</p>'
						: ""
				}

        ${
					match.status === "in_progress"
						? '<p class="mt-3 text-center text-sm text-blue-600 font-semibold">⚔️ 試合中</p>'
						: ""
				}
        ${
					match.status === "completed"
						? '<p class="mt-3 text-center text-sm text-green-600 font-semibold">✓ 完了</p>'
						: ""
				}
      </div>
    `;
	}

	private renderMatchPlayer(
		participant: TournamentParticipantDTO | undefined,
		winnerId: string | undefined,
	): string {
		if (!participant) {
			return '<div class="text-gray-400 text-sm text-center py-2">BYE</div>';
		}

		const isWinner = winnerId === participant.id;

		return `
      <div class="flex items-center gap-3 p-2 rounded ${isWinner ? "bg-yellow-100" : ""}">
        <img
          src="${participant.user.avatar}"
          alt="${participant.user.username}"
          class="w-10 h-10 rounded-full"
        />
        <span class="flex-1 text-base font-medium ${isWinner ? "text-yellow-700" : ""}">${participant.user.username}</span>
        ${isWinner ? '<span class="text-yellow-500 text-xl">★</span>' : ""}
      </div>
    `;
	}

	private getStatusLabel(status: TournamentStatus): string {
		switch (status) {
			case "registration":
				return "受付中";
			case "in_progress":
				return "進行中";
			case "completed":
				return "完了";
			case "cancelled":
				return "中止";
			default:
				return status;
		}
	}

	private getStatusColor(status: TournamentStatus): string {
		switch (status) {
			case "registration":
				return "bg-green-100 text-green-800";
			case "in_progress":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-gray-100 text-gray-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	}

	private getParticipantStatusLabel(
		status: "active" | "eliminated" | "withdrawn",
	): string {
		switch (status) {
			case "active":
				return "参加中";
			case "eliminated":
				return "敗退";
			case "withdrawn":
				return "辞退";
			default:
				return status;
		}
	}
}
