import { Component } from "../component";

type Props = {
	color?: "blue" | "gray";
	width?: "full";
	type?: "submit" | "button";
	text: string;
};

export class Button extends Component {
	render({ color = "blue", width, type = "button", text }: Props): string {
		const widthClass = width === "full" ? "w-full" : "";

		if (color === "gray") {
			return `
        <button type="${type}" data-link class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors ${widthClass}">
          ${text}
        </button>
      `;
		}
		return `
      <button type="${type}" data-link class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors ${widthClass}">
        ${text}
      </button>
    `;
	}
}
