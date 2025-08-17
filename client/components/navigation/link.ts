import { Component } from "../component";

type Props = {
	color?: "blue" | "gray";
	href: string;
	text: string;
};

export class Link extends Component {
	private readonly color: "blue" | "gray";
	private readonly href: string;
	private readonly text: string;

	constructor({ color = "blue", href, text }: Props) {
		super();
		this.color = color;
		this.href = href;
		this.text = text;
	}

	render(): string {
		if (this.color === "gray") {
			return `
        <a href="${this.href}" data-link class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
          ${this.text}
        </a>
      `;
		}
		return `
      <a href="${this.href}" data-link class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        ${this.text}
      </a>
    `;
	}
}
