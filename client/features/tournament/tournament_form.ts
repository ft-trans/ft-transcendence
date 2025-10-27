import type { CreateTournamentRequest } from "@shared/api/tournament";
import { createTournament } from "client/api/tournament";
import { Component, SectionTitle } from "client/components";
import { navigateTo } from "client/router";

type ViewState =
	| { phase: "idle" }
	| { phase: "submitting" }
	| { phase: "error"; error: string };

export class TournamentForm extends Component {
	private state: ViewState = { phase: "idle" };

	render(): string {
		return `
      <div id="tournament-form-root">
        ${this.inner()}
      </div>
    `;
	}

	onLoad(): void {
		this.attachEventListeners();
	}

	private attachEventListeners(): void {
		const form = document.getElementById(
			"tournament-form",
		) as HTMLFormElement | null;
		if (!form) return;

		form.addEventListener("submit", (ev) => {
			ev.preventDefault();
			void this.handleSubmit(form);
		});
	}

	private async handleSubmit(form: HTMLFormElement): Promise<void> {
		this.setState({ phase: "submitting" });

		const formData = new FormData(form);
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const maxParticipantsStr = formData.get("maxParticipants") as string;
		const maxParticipants = Number.parseInt(maxParticipantsStr, 10);

		// バリデーション
		if (!name || name.trim().length === 0) {
			this.setState({
				phase: "error",
				error: "トーナメント名を入力してください",
			});
			return;
		}

		if (maxParticipants < 2 || maxParticipants > 64) {
			this.setState({
				phase: "error",
				error: "最大参加者数は2〜64人の範囲で設定してください",
			});
			return;
		}

		const request: CreateTournamentRequest = {
			name: name.trim(),
			description: description.trim() || undefined,
			maxParticipants,
		};

		try {
			const response = await createTournament(request);
			// 作成したトーナメントの詳細ページに遷移
			navigateTo(`/tournaments/${response.id}`);
		} catch (error) {
			console.error("Failed to create tournament:", error);
			this.setState({
				phase: "error",
				error: "トーナメントの作成に失敗しました",
			});
		}
	}

	private setState(next: ViewState): void {
		this.state = next;
		const host = document.querySelector<HTMLElement>("#tournament-form-root");
		if (host) host.innerHTML = this.inner();

		// イベントリスナーを再アタッチ
		if (next.phase === "idle" || next.phase === "error") {
			this.attachEventListeners();
		}
	}

	private inner(): string {
		const { phase } = this.state;
		const isSubmitting = phase === "submitting";

		return `
      <div class="max-w-2xl mx-auto">
        ${new SectionTitle({ text: "トーナメント作成" }).render()}

        ${
					phase === "error"
						? `
          <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-700">${this.state.error}</p>
          </div>
        `
						: ""
				}

        <form id="tournament-form" class="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              トーナメント名 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              maxlength="100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例: 新春トーナメント2025"
              ${isSubmitting ? "disabled" : ""}
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              説明（任意）
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              maxlength="500"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="トーナメントの説明を入力してください"
              ${isSubmitting ? "disabled" : ""}
            ></textarea>
          </div>

          <div>
            <label for="maxParticipants" class="block text-sm font-medium text-gray-700 mb-2">
              最大参加者数 <span class="text-red-500">*</span>
            </label>
            <select
              id="maxParticipants"
              name="maxParticipants"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ${isSubmitting ? "disabled" : ""}
            >
              <option value="4">4人</option>
              <option value="8" selected>8人</option>
              <option value="16">16人</option>
              <option value="32">32人</option>
              <option value="64">64人</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              参加者が最大人数に満たない場合でも、トーナメントを開始できます
            </p>
          </div>

          <div class="flex gap-4">
            <button
              type="submit"
              class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              ${isSubmitting ? "disabled" : ""}
            >
              ${isSubmitting ? "作成中..." : "トーナメントを作成"}
            </button>

            <a
              href="/tournaments"
              data-link
              class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-center font-medium ${isSubmitting ? "pointer-events-none opacity-50" : ""}"
            >
              キャンセル
            </a>
          </div>
        </form>
      </div>
    `;
	}
}
