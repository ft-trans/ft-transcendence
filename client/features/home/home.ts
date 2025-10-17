import { Component } from "client/components";
import { Link } from "client/components/navigation/link";

export class Home extends Component {
	render(): string {
		return `
      <div>
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Simple SPA</h2>
          <p class="text-xl text-gray-600 mb-8">A TypeScript-based single page application framework</p>
          <div class="mt-8 flex justify-center">
            ${new Link({ href: "/matchmaking", text: "マッチを探す" }).render()}
          </div>
          <div class="mt-8 flex justify-center">
            ${new Link({ href: "/tournaments/new", text: "トーナメント" }).render()}
          </div>
        </div>
      </div>
    `;
	}
}
