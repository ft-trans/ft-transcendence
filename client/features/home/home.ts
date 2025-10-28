import { Component } from "client/components";
import { Link } from "client/components/navigation/link";

export class Home extends Component {
	render(): string {
		return `
      <div>
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4 italic">Welcome to Transcendence</h1>
          <p class="text-xl text-gray-600 mb-8 italic">The Ultimate Pong Experience Awaits You!</p>
          <div class="mt-8 flex justify-center gap-4">
            ${new Link({ href: "/matchmaking", text: "マッチを探す" }).render()}
            ${new Link({ href: "/tournaments", text: "トーナメント" }).render()}
          </div>
        </div>
      </div>
    `;
	}
}
