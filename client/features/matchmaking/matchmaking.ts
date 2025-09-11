import { ApiClient } from "client/api/api_client";
import {
  Button,
  Component,
  FloatingBanner,
  SectionTitle,
} from "client/components";

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

export class Matchmaking extends Component {
  private state: ViewState = { phase: "idle" };
  private readonly api = new ApiClient();

  private setState(next: ViewState): void {
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
      joinBtn.addEventListener("click", async () => {
        this.setState({ phase: "joining", note: "サーバへ参加リクエストを送信中..." });
        try {
          const res = await this.api.post<unknown, MatchResponse>(this.pathJoin(), {});
          if (res.message === "マッチしました！") {
            this.setState({ phase: "matched", match: res.match });
            new FloatingBanner({ message: "🎉 マッチが成立しました！", type: "info" }).show();
          } else {
            this.setState({
              phase: "waiting",
              note: "キューに参加しました。",
              lastMessage: res.message,
            });
            new FloatingBanner({ message: "待機中です。別のプレイヤーを待っています。", type: "info" }).show();
          }
        } catch (e: any) {
          this.setState({ phase: "error", error: e?.message ?? "参加に失敗しました" });
          new FloatingBanner({ message: "参加に失敗しました", type: "error" }).show();
        }
      });
    }

    const leaveBtn = root.querySelector<HTMLButtonElement>("#leave-btn, #leave-btn2");
    if (leaveBtn) {
      leaveBtn.addEventListener("click", async () => {
        this.setState({ phase: "leaving" });
        try {
          await this.api.post(this.pathLeave(), {});
          this.setState({ phase: "idle" });
          new FloatingBanner({ message: "キューから離脱しました", type: "info" }).show();
        } catch (e: any) {
          this.setState({ phase: "error", error: e?.message ?? "離脱に失敗しました" });
          new FloatingBanner({ message: "離脱に失敗しました", type: "error" }).show();
        }
      });
    }

    const backBtn = root.querySelector<HTMLButtonElement>("#back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.setState({ phase: "idle" }));
    }
  }

  render(): string {
    return `<div id="matchmaking-root">${this.inner()}</div>`;
  }

  private inner(): string {
    const busy =
      this.state.phase === "joining" || this.state.phase === "leaving"
        ? `<p class="text-sm opacity-70 mt-2">少々お待ちください…</p>`
        : "";

    if (this.state.phase === "idle") {
      return `
        <div>
          ${new SectionTitle({ text: "マッチメイキング" }).render()}
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
      const participants = m.participants.map((p) => `<li class="font-mono">${p.id}</li>`).join("");
      return `
        <div>
          ${new SectionTitle({ text: "Matchmaking" }).render()}
          <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
            <div class="rounded-xl border px-4 py-3 bg-green-50">
              🎉 マッチが成立しました！（ID: <span class="font-mono">${m.id}</span>）
            </div>
            <ul class="list-disc pl-6 space-y-1">
              <li>status: ${m.status}</li>
              ${m.gameType ? `<li>gameType: ${m.gameType}</li>` : ""}
              <li>createdAt: ${new Date(m.createdAt).toLocaleString()}</li>
              <li>participants:<ul class="list-disc pl-6">${participants}</ul></li>
            </ul>
            <div class="flex justify-center">
              ${new Button({ id: "leave-btn2", text: "キューから離脱する", type: "button" }).render()}
            </div>
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

    // error
    return `
      <div>
        ${new SectionTitle({ text: "Matchmaking" }).render()}
        <div class="max-w-2xl mx-auto rounded-2xl shadow p-6 space-y-4">
          <div class="rounded-xl border px-4 py-3 bg-red-50">
            エラー: ${(this.state as any).error ?? "不明なエラー"}
          </div>
          <div class="flex justify-center">
            ${new Button({ id: "back-btn", text: "戻る", type: "button" }).render()}
          </div>
        </div>
      </div>
    `;
  }
}
