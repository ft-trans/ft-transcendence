import {
	type GetMatchPlayersResponse,
	PONG_COMMAND,
	type PongGameStateResponse,
	type PongPlayerInfo,
} from "@shared/api/pong";
import { ApiClient } from "client/api/api_client";
import {
	Component,
	FloatingBanner,
	type RouteParams,
	SectionTitle,
} from "client/components";
import { PongGame } from "client/components/pong_game";
import { navigateTo } from "client/router";

export class MatchesPong extends Component {
	private readonly pongGame: PongGame;

	constructor() {
		super();
		this.pongGame = new PongGame();
	}

	onLoad(params: RouteParams): void {
		const pongCourt = document.getElementById("pong-court");
		if (pongCourt) {
			this.pongGame.appendTo(pongCourt);
		}

		const matchId = params.match_id;
		if (!matchId) {
			throw new Error("Match ID is required");
		}
		const socket = new WebSocket(`/ws/pong/matches/${matchId}`);

		socket.onmessage = (event) => {
			const state: PongGameStateResponse = JSON.parse(event.data);
			if (state.event === "error") {
				new FloatingBanner({
					message: state.message ?? "不明なエラーが発生しました",
					type: "error",
				}).show();
				navigateTo("/matchmaking");
				return;
			}
			this.pongGame.draw(state);
		};

		// TODO 画面遷移時にイベントを削除する
		document.addEventListener("keydown", (event) => {
			switch (event.code) {
				case "KeyW":
					socket.send(PONG_COMMAND.PADDLE1_UP);
					break;
				case "KeyS":
					socket.send(PONG_COMMAND.PADDLE1_DOWN);
					break;
				case "ArrowUp":
					socket.send(PONG_COMMAND.PADDLE2_UP);
					break;
				case "ArrowDown":
					socket.send(PONG_COMMAND.PADDLE2_DOWN);
					break;
				default:
					return;
			}
		});

		new ApiClient()
			.get<GetMatchPlayersResponse>(`/api/matchmaking/${matchId}/players`)
			.then((res: GetMatchPlayersResponse) => {
				const player1Div = document.getElementById("pong-player1");
				if (player1Div) {
					player1Div.innerHTML = this.renderPlayer(res.player1);
				}
				const player2Div = document.getElementById("pong-player2");
				if (player2Div) {
					player2Div.innerHTML = this.renderPlayer(res.player2);
				}
			});
	}

	render(): string {
		return `
<div>
    ${new SectionTitle({ text: "Pong!!" }).render()}
    <div id="pong-court" class="flex justify-center items-center">
    </div>
	<div class="flex justify-around mt-4 max-w-2xl mx-auto">
		<div id="pong-player1">
		</div>
		<div class="text-center mt-4 text-gray-700 ">
			<small>
				<p>w/sキーでパドル1を上下移動</p>
				<p>↑/↓キーでパドル2を上下移動</p>
			</small>
		</div>
		<div id="pong-player2">
		</div>
	</div>
</div>
`;
	}

	private renderPlayer(player: PongPlayerInfo | undefined): string {
		return `
<div class="flex flex-col items-center">
	${player?.avatar ? `<img src="${player.avatar}" alt="Avatar" class="w-12 h-12 rounded-full mb-2">` : `<div class="w-12 h-12 rounded-full bg-gray-300 mb-2"></div>`}
	<p>${player?.username ? player.username : ""}</p>
</div>
	`;
	}
}
