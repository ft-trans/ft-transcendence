import type { PongGameStateResponse } from "@shared/api/pong";
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
			if (event.code === "Space") {
				// TODO ゲーム開始は後でちゃんと書く
				// TODO イベントの種類を./shared/apiで管理
				socket.send("start");
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
		<small>スペースキーでゲーム開始</small>
	</div>
</div>
`;
	}
}
