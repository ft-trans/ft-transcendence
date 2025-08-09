import { Component } from "../component";
import { Header } from "../navigation";

export class Navigation extends Component {
	private readonly child: Component;
	constructor(child: Component) {
		super();
		this.child = child;
	}

	render(): string {
		return `
      <div class="min-h-screen">
        ${new Header().render()}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">${this.child.render(undefined)}</main>
      </div>
    `;
	}

	addEventListeners(): void {
		this.child.addEventListeners();
	}
}
