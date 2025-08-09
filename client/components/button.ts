import { Component } from "./component";

type Props = {
	color?: "blue" | "gray";
	href: string;
	text: string;
};

export class Button extends Component {
	render({ color = "blue", href, text }: Props): string {
		if (color === "gray") {
			return `
        <a href="${href}" data-link class="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
          ${text}
        </a>
      `;
		}
		return `
      <a href="${href}" data-link class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        ${text}
      </a>
    `;
	}
}
