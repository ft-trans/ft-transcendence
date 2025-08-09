import { Component } from "./component";

type Props = {
	forHTML: string;
	text: string;
};

export class Label extends Component {
	render({ forHTML, text }: Props): string {
		return `
      <label for="${forHTML}" class="block text-sm font-medium text-gray-700">
        ${text}
      </label>
    `;
	}
}
