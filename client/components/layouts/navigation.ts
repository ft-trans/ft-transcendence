import { Component } from "../component";
import { Link } from "../navigation";

type Props = {
	child: Component;
};

export class Navigation extends Component {
	private readonly child: Component;
	constructor({ child }: Props) {
		super();
		this.child = child;
	}

	render(): string {
		return `
      <div class="min-h-screen">
        <header class="bg-white shadow-sm">
          <div class="px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <h1 class="text-2xl font-bold text-gray-900">
                  <a href="/" data-link class="hover:text-blue-600">ft_trans</a>
              </h1>
              <nav class="space-x-6">
                ${new Link({ href: "/auth/register", text: "登録" }).render()}
                ${new Link({ href: "/profile/edit", text: "変更" }).render()}
                ${new Link({ href: "/matchmaking", text: "マッチ" }).render()}
              </nav>
            </div>
          </div>
        </header>
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">${this.child.render()}</main>
      </div>
    `;
	}

	addEventListeners(): void {
		this.child.addEventListeners();
	}
}
