import { Component } from "../component";

type ButtonColor = "blue" | "gray";
type ButtonWidth = "full";
type ButtonType = "submit" | "button";

type Props = {
	color?: ButtonColor;
	width?: ButtonWidth;
	type?: ButtonType;
	text: string;
};

export class Button extends Component {
	private readonly color: ButtonColor;
	private readonly width: ButtonWidth | undefined;
	private readonly type: ButtonType;
	private readonly text: string;

	constructor({ color = "blue", width, type = "button", text }: Props) {
		super();
		this.color = color;
		this.width = width;
		this.type = type;
		this.text = text;
	}

	render(): string {
		const widthClass = this.width === "full" ? "w-full" : "";

		if (this.color === "gray") {
			return `
        <button type="${this.type}" class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors ${widthClass}">
          ${this.text}
        </button>
      `;
		}
		return `
      <button type="${this.type}" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors ${widthClass}">
        ${this.text}
      </button>
    `;
	}
}
