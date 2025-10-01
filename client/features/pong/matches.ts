import { PONG_COMMAND, type PongGameStateResponse } from "@shared/api/pong";
import { Component, type RouteParams, SectionTitle } from "client/components";
import { PongGame } from "client/components/pong_game";

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
			this.pongGame.draw(state);
		};

		// TODO 画面遷移時にイベントを削除する
		document.addEventListener("keydown", (event) => {
			switch (event.code) {
				case "Space":
					socket.send(PONG_COMMAND.START);
					break;
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
	}

	render(): string {
		return `
<div>
    ${new SectionTitle({ text: "Pong!!" }).render()}
    <div id="pong-court" class="flex justify-center items-center">
    </div>
	<div class="text-center mt-4 text-gray-700">
		<small>
			<p>スペースキーでゲーム開始</p>
			<p>w/sキーでパドル1を上下移動</p>
			<p>↑/↓キーでパドル2を上下移動</p>
		</small>
	</div>
</div>
`;
	}
}
