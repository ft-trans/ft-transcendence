import type { TournamentDTO, TournamentStatus } from "@shared/api/tournament";
import { getTournaments } from "client/api/tournament";
import { Avatar, Component, SectionTitle } from "client/components";
import { authStore } from "client/store/auth_store";

type ViewState =
	| { phase: "loading" }
	| { phase: "loaded"; tournaments: TournamentDTO[] }
	| { phase: "error"; error: string };

export class TournamentList extends Component {
	private state: ViewState = { phase: "loading" };
	private currentFilter: TournamentStatus | "all" = "all";

	render(): string {
		return `
      <div id="tournament-list-root">
        ${this.inner()}
      </div>
    `;
	}

	onLoad(): void {
		void this.loadTournaments();
		this.attachEventListeners();
	}

	private attachEventListeners(): void {
		// フィルターボタン
		document.addEventListener("click", (ev) => {
			const target = ev.target as HTMLElement;
			const filterBtn = target.closest<HTMLButtonElement>(
				"[data-tournament-filter]",
			);
			if (filterBtn) {
				ev.preventDefault();
				const filter = filterBtn.dataset.tournamentFilter as
					| TournamentStatus
					| "all";
				this.currentFilter = filter;
				void this.loadTournaments();
			}
		});
	}

	private async loadTournaments(): Promise<void> {
		try {
			this.setState({ phase: "loading" });

			const query =
				this.currentFilter === "all"
					? {}
					: { status: this.currentFilter as TournamentStatus };

			const response = await getTournaments(query);
			this.setState({ phase: "loaded", tournaments: response.tournaments });
		} catch (error) {
			console.error("Failed to load tournaments:", error);
			this.setState({
				phase: "error",
				error: "トーナメント一覧の取得に失敗しました",
			});
		}
	}

	private setState(next: ViewState): void {
		this.state = next;
		const host = document.querySelector<HTMLElement>("#tournament-list-root");
		if (host) host.innerHTML = this.inner();
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
        </div>
      `;
		}

		const { tournaments } = this.state;
		const currentUser = authStore.getState().user;

		return `
      <div class="max-w-6xl mx-auto">
        ${new SectionTitle({ text: "トーナメント" }).render()}

        <div class="mb-6 flex justify-between items-center">
          <div class="flex gap-2">
            ${this.renderFilterButton("all", "すべて")}
            ${this.renderFilterButton("registration", "受付中")}
            ${this.renderFilterButton("in_progress", "進行中")}
            ${this.renderFilterButton("completed", "完了")}
          </div>

          ${
						currentUser
							? '<a href="/tournaments/new" data-link class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">+ トーナメント作成</a>'
							: ""
					}
        </div>

        ${
					tournaments.length === 0
						? `
          <div class="text-center py-12 bg-white rounded-lg shadow">
            <p class="text-gray-500 mb-4">トーナメントがありません</p>
            ${
							currentUser
								? '<a href="/tournaments/new" data-link class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">最初のトーナメントを作成</a>'
								: ""
						}
          </div>
        `
						: `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${tournaments.map((t) => this.renderTournamentCard(t)).join("")}
          </div>
        `
				}
      </div>
    `;
	}

	private renderFilterButton(
		filter: TournamentStatus | "all",
		label: string,
	): string {
		const isActive = this.currentFilter === filter;
		return `
      <button
        data-tournament-filter="${filter}"
        class="px-4 py-2 rounded ${
					isActive
						? "bg-blue-600 text-white"
						: "bg-gray-200 text-gray-700 hover:bg-gray-300"
				}"
      >
        ${label}
      </button>
    `;
	}

	private renderTournamentCard(tournament: TournamentDTO): string {
		const statusLabel = this.getStatusLabel(tournament.status);
		const statusColor = this.getStatusColor(tournament.status);

		return `
      <a href="/tournaments/${tournament.id}" data-link class="block">
        <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl font-bold text-gray-900">${tournament.name}</h3>
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
              ${statusLabel}
            </span>
          </div>

          ${
						tournament.description
							? `<p class="text-gray-600 mb-4 line-clamp-2">${tournament.description}</p>`
							: ""
					}

          <div class="flex items-center gap-2 mb-4">
		  	${new Avatar({
					src: tournament.organizer.avatar,
					size: 6,
					alt: tournament.organizer.username,
				}).render()}
            <span class="text-sm text-gray-600">主催: ${tournament.organizer.username}</span>
          </div>

          <div class="flex justify-between text-sm text-gray-600">
            <span>参加者: ${tournament.participantCount}/${tournament.maxParticipants}</span>
            <span>${new Date(tournament.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </a>
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
}
