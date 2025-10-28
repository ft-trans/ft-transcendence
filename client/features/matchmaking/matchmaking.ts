import { ApiClient } from "client/api/api_client";
import {
	Button,
	Component,
	FloatingBanner,
	Link,
	SectionTitle,
} from "client/components";
import { navigateTo } from "client/router";
import { buildWebSocketUrl } from "client/utils/websocket";

type MatchParticipant = { id: string };
type MatchResult = {
	id: string;
	participants: MatchParticipant[];
	status: string;
	gameType?: string | null;
	createdAt: string;
};
type MatchResponse =
	| { message: "マッチしました！"; match: MatchResult }
	| { message: "マッチング待機中です。別のプレイヤーをお待ちください。" };

type ViewState =
	| { phase: "idle" }
	| { phase: "joining"; note?: string }
	| { phase: "waiting"; note?: string; lastMessage?: string }
	| { phase: "matched"; match: MatchResult }
	| { phase: "leaving" }
	| { phase: "error"; error: string };

function isAxiosLikeError(e: unknown): e is {
	response?: { status?: number; data?: { message?: string } };
	message?: string;
} {
	if (typeof e !== "object" || e === null) return false;
	const msgOk =
		typeof (e as { message?: unknown }).message === "string" ||
		(e as { message?: unknown }).message === undefined;
	if (!msgOk) return false;
	const resp = (e as { response?: unknown }).response;
	if (resp === undefined) return true;
	if (typeof resp !== "object" || resp === null) return false;
	const status = (resp as { status?: unknown }).status;
	const data = (resp as { data?: unknown }).data;
	return (
		(typeof status === "number" || status === undefined) &&
		(typeof data === "object" || data === undefined)
	);
}

export class Matchmaking extends Component {
	private state: ViewState = { phase: "idle" };
	private readonly api = new ApiClient();
	private ws: WebSocket | null = null;

	private static delegated = false;

	constructor() {
		super();
		if (!Matchmaking.delegated) {
			document.addEventListener("click", this.onDocClick, { passive: false });
			Matchmaking.delegated = true;
		}
	}

	private onDocClick = (ev: MouseEvent) => {
		const root = document.querySelector<HTMLElement>("#matchmaking-root");
		if (!root) return;
		const target = ev.target as HTMLElement | null;
		if (!target || !root.contains(target)) return;

		const join = target.closest<HTMLButtonElement>("#join-btn");
		if (join) {
			ev.preventDefault();
			void this.handleJoin();
			return;
		}

		const leave = target.closest<HTMLButtonElement>("#leave-btn, #leave-btn2");
		if (leave) {
			ev.preventDefault();
			void this.handleLeave();
			return;
		}

		const back = target.closest<HTMLButtonElement>("#back-btn");
		if (back) {
			ev.preventDefault();
			this.setState({ phase: "idle" });
			return;
		}
	};

	private setState(next: ViewState): void {
		if (this.ws && next.phase !== "waiting") {
			this.cleanupWebSocket();
		}
		this.state = next;
		const host = document.querySelector<HTMLElement>("#matchmaking-root");
		if (host) host.innerHTML = this.inner();
		this.addEventListeners();
	}

	private pathJoin(): string {
		return "/api/matchmaking/join";
	}
	private pathLeave(): string {
		return "/api/matchmaking/leave";
	}

	addEventListeners(): void {
		const root = document.querySelector<HTMLElement>("#matchmaking-root");
		if (!root) return;

		const joinBtn = root.querySelector<HTMLButtonElement>("#join-btn");
		if (joinBtn) {
			const clone = joinBtn.cloneNode(true) as HTMLButtonElement;
			joinBtn.replaceWith(clone);
			clone.addEventListener("click", () => {
				void this.handleJoin();
			});
		}

		const leaveBtn = root.querySelector<HTMLButtonElement>(
			"#leave-btn, #leave-btn2",
		);
		if (leaveBtn) {
			const clone = leaveBtn.cloneNode(true) as HTMLButtonElement;
			leaveBtn.replaceWith(clone);
			clone.addEventListener("click", () => {
				void this.handleLeave();
			});
		}

		const backBtn = root.querySelector<HTMLButtonElement>("#back-btn");
		if (backBtn) {
			const clone = backBtn.cloneNode(true) as HTMLButtonElement;
			backBtn.replaceWith(clone);
			clone.addEventListener("click", () => this.setState({ phase: "idle" }));
		}
	}

	private async handleJoin(): Promise<void> {
		this.setState({
			phase: "joining",
			note: "サーバへ参加リクエストを送信中...",
		});
		try {
			const res = await this.api.post<unknown, MatchResponse>(
				this.pathJoin(),
				{},
			);
			if (res.message === "マッチしました！") {
				this.setState({ phase: "matched", match: res.match });
				new FloatingBanner({
					message: "🎉 マッチが成立しました！",
					type: "info",
				}).show();
			} else {
				this.setState({
					phase: "waiting",
					note: "キューに参加しました。",
					lastMessage: res.message,
				});
				this.setupWebSocket();
				new FloatingBanner({
					message: "待機中です。別のプレイヤーを待っています。",
					type: "info",
				}).show();
			}
		} catch (e: unknown) {
			let msg = "参加に失敗しました";
			if (isAxiosLikeError(e)) {
				const status = e.response?.status;
				msg = e.response?.data?.message ?? e.message ?? msg;
				if (status === 401) {
					this.setState({
						phase: "error",
						error: "未ログインです。ログイン後に再度お試しください。",
					});
					new FloatingBanner({
						message: "未ログインです。ログインしてください。",
						type: "error",
					}).show();
					return;
				}
			}
			this.setState({ phase: "error", error: msg });
			new FloatingBanner({
				message: "参加に失敗しました",
				type: "error",
			}).show();
		}
	}

	private async handleLeave(): Promise<void> {
		this.cleanupWebSocket();
		this.setState({ phase: "leaving" });
		try {
			await this.api.post(this.pathLeave(), {});
			this.setState({ phase: "idle" });
			new FloatingBanner({
				message: "キューから離脱しました",
				type: "info",
			}).show();
		} catch (e: unknown) {
			const msg = isAxiosLikeError(e)
				? (e.response?.data?.message ?? e.message ?? "離脱に失敗しました")
				: "離脱に失敗しました";
			this.setState({ phase: "error", error: msg });
			new FloatingBanner({
				message: "離脱に失敗しました",
				type: "error",
			}).show();
		}
	}

	private setupWebSocket(): void {
		if (this.ws) return;

		const wsUrl = buildWebSocketUrl("/ws/matchmaking");

		console.log(`[WS] Connecting to ${wsUrl}`);
		this.ws = new WebSocket(wsUrl);

		this.ws.addEventListener("open", () => {
			console.log("[WS] Connection established.");
		});

		this.ws.addEventListener("message", (event) => {
			console.log("[WS] Message received:", event.data);
			try {
				const payload = JSON.parse(event.data);
				if (payload.event === "matchFound") {
					this.setState({ phase: "matched", match: payload.data });
					new FloatingBanner({
						message: "🎉 マッチが成立しました！（通知）",
						type: "info",
					}).show();
				}
			} catch (error) {
				console.error("[WS] Failed to parse message:", error);
			}
		});

		this.ws.addEventListener("close", () => {
			console.log("[WS] Connection closed.");
			this.ws = null;
		});

		this.ws.addEventListener("error", (error) => {
			console.error("[WS] WebSocket error:", error);
			this.setState({
				phase: "error",
				error: "リアルタイム接続でエラーが発生しました。",
			});
		});
	}

	private cleanupWebSocket(): void {
		if (this.ws) {
			console.log("[WS] Cleaning up WebSocket connection.");
			this.ws.onopen = null;
			this.ws.onmessage = null;
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.close();
			this.ws = null;
		}
	}

	async onLoad(): Promise<void> {
		const currentMatch = await this.api.get<MatchResult>("/api/matchmaking");
		if (currentMatch) {
			const root = document.getElementById("matchmaking-root");
			if (root) {
				root.innerHTML = this.currentMatch(currentMatch.id);
			}
		}
	}

	render(): string {
		return `<div id="matchmaking-root">${this.inner()}</div>`;
	}

	private currentMatch(matchId: string): string {
		return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
            <div class="flex justify-center">
              ${new Link({ text: "ゲームを開始する", color: "blue", href: `/pong/matches/${matchId}` }).render()}
            </div>
          </div>
        </div>
		`;
	}

	private inner(): string {
		const busy =
			this.state.phase === "joining" || this.state.phase === "leaving"
				? `<p class="text-sm opacity-70 mt-2">少々お待ちください…</p>`
				: "";

		if (this.state.phase === "idle") {
			return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
            <p class="text-gray-700">Pong の対戦相手を探します。</p>
            <div class="flex justify-center">
              ${new Button({ id: "join-btn", text: "参加する", type: "button" }).render()}
            </div>
          </div>
        </div>
      `;
		}

		if (this.state.phase === "joining") {
			return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6">
            <p>参加処理中です…</p>
            ${"note" in this.state && this.state.note ? `<p class="text-sm opacity-70">${this.state.note}</p>` : ""}
            ${busy}
          </div>
        </div>
      `;
		}

		if (this.state.phase === "waiting") {
			return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
            <div class="rounded-xl border px-4 py-3 bg-gray-50">
              ${this.state.lastMessage ?? "マッチング待機中です。"}
            </div>
            ${"note" in this.state && this.state.note ? `<p class="text-sm opacity-70">${this.state.note}</p>` : ""}
            <div class="flex justify-center">
              ${new Button({ id: "leave-btn", text: "離脱する", type: "button", color: "gray" }).render()}
            </div>
            ${busy}
          </div>
        </div>
      `;
		}

		if (this.state.phase === "matched") {
			const m = this.state.match;
			const participants = m.participants
				.map((p) => `<li class="font-mono">${p.id}</li>`)
				.join("");
			setTimeout(() => {
				navigateTo(`/pong/matches/${m.id}`);
			}, 3000);
			return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
		    <div class="flex justify-center">
              ${new Link({ text: "ゲームを開始する", color: "blue", href: `/pong/matches/${m.id}` }).render()}
			</div>
            <div class="rounded-xl border px-4 py-3 bg-green-50 mt-10">
              マッチが成立しました!（ID: <span class="font-mono">${m.id}</span>）
            </div>
            <ul class="list-disc pl-6 space-y-1">
              <li>status: ${m.status}</li>
              ${m.gameType ? `<li>gameType: ${m.gameType}</li>` : ""}
              <li>createdAt: ${new Date(m.createdAt).toLocaleString()}</li>
              <li>participants:<ul class="list-disc pl-6">${participants}</ul></li>
            </ul>
            ${busy}
          </div>
        </div>
      `;
		}

		if (this.state.phase === "leaving") {
			return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6">
            <p>離脱処理中です…</p>
            ${busy}
          </div>
        </div>
      `;
		}

		return `
      <div>
        ${new SectionTitle({ text: "Matchmaking" }).render()}
        <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
          <div class="rounded-xl border px-4 py-3 bg-red-50">
            エラー: ${(this.state as ViewState & { error?: string }).error ?? "不明なエラー"}
          </div>
          <div class="flex justify-center">
            ${new Button({ id: "back-btn", text: "戻る", type: "button" }).render()}
          </div>
        </div>
      </div>
    `;
	}
}
