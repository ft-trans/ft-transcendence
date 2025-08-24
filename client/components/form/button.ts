import { Component } from "../component";

type ButtonColor = "blue" | "red" | "gray";
type ButtonWidth = "full";
type ButtonType = "submit" | "button";

type Props = {
	color?: ButtonColor;
	width?: ButtonWidth;
	type?: ButtonType;
	text: string;
	id?: string;
};

export class Button extends Component {
	private readonly color: ButtonColor;
	private readonly width: ButtonWidth | undefined;
	private readonly type: ButtonType;
	private readonly text: string;
	private readonly id: string | undefined;

	constructor({ color = "blue", width, type = "button", text, id }: Props) {
		super();
		this.color = color;
		this.width = width;
		this.type = type;
		this.text = text;
		this.id = id;
	}

	render(): string {
		const widthClass = this.width === "full" ? "w-full" : "";

		const styleClass = [
			"px-6",
			"py-3",
			"rounded-lg",
			"transition-colors",
			"cursor-pointer",
			widthClass,
		];

		if (this.color === "blue") {
			styleClass.push("bg-blue-600", "hover:bg-blue-700", "text-white");
		} else if (this.color === "red") {
			styleClass.push("bg-red-600", "hover:bg-red-700", "text-white");
		} else if (this.color === "gray") {
			styleClass.push("bg-gray-200", "hover:bg-gray-300", "text-gray-800");
		}

		const idAttribute = this.id ? `id="${this.id}"` : "";

		return `
      <button ${idAttribute} type="${this.type}" class="${styleClass.join(" ")}">
        ${this.text}
      </button>
    `;
	}
}
