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

		const socket = new WebSocket(
			`ws://localhost:3000/ws/pong/matches/${matchId}`,
		);

		socket.onmessage = (event) => {
			console.log("Received message:", event);
			// 受信したメッセージを表示;
			const pongCourt2 = document.getElementById("pong-court2");
			console.log("pongCourt:", pongCourt2);
			if (pongCourt2) {
				pongCourt2.innerHTML = `<div>${event.data}</div>`;
			}
			const state: PongGameStateResponse = JSON.parse(event.data);
			this.pongGame.draw(state);
		};

		document.addEventListener("keydown", (event) => {
			if (event.code === "Space") {
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
	<div id="pong-court2" class="mt-4">
	</div>
</div>
`;
	}
}
