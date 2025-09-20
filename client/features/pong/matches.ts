import {
	type PongGameStateResponse,
	pongCommandPaddle1Down,
	pongCommandPaddle1Up,
	pongCommandPaddle2Down,
	pongCommandPaddle2Up,
	pongCommandStart,
} from "@shared/api/pong";
import { Component, SectionTitle } from "client/components";

import { PongGame } from "client/components/pong_game";

export class MatchesPong extends Component {
	private readonly pongGame: PongGame;

	constructor() {
		super();
		this.pongGame = new PongGame();
	}

	addEventListeners(): void {
		const pongCourt = document.getElementById("pong-court");
		if (pongCourt) {
			this.pongGame.appendTo(pongCourt);
		}

		// TODO: 正しい方法でURLからmatch_idを取得
		const url = new URL(window.location.href);
		const matchId = url.pathname.split("/").pop() || "";

		const socket = new WebSocket(`/ws/pong/matches/${matchId}`);

		socket.onmessage = (event) => {
			const state: PongGameStateResponse = JSON.parse(event.data);
			this.pongGame.draw(state);
		};

		// TODO 画面遷移時にイベントを削除する
		document.addEventListener("keydown", (event) => {
			switch (event.code) {
				case "Space":
					socket.send(pongCommandStart);
					break;
				case "KeyW":
					socket.send(pongCommandPaddle1Up);
					break;
				case "KeyS":
					socket.send(pongCommandPaddle1Down);
					break;
				case "ArrowUp":
					socket.send(pongCommandPaddle2Up);
					break;
				case "ArrowDown":
					socket.send(pongCommandPaddle2Down);
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
