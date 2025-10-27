import { Component } from "client/components";
import { Link } from "client/components/navigation/link";

export class Home extends Component {
	render(): string {
		return `
      <div>
        <div class="text-center mb-12">
          <div class="mt-8 flex justify-center">
            ${new Link({ href: "/matchmaking", text: "マッチを探す" }).render()}
          </div>
          <div class="mt-8 flex justify-center">
            ${new Link({ href: "/tournaments", text: "トーナメント" }).render()}
          </div>
        </div>
      </div>
    `;
	}
}
