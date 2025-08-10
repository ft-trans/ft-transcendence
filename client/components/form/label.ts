import { Component } from "../component";

type Props = {
	forHTML: string;
	text: string;
};

export class Label extends Component {
	private readonly forHTML: string;
	private readonly text: string;

	constructor({ forHTML, text }: Props) {
		super();
		this.forHTML = forHTML;
		this.text = text;
	}

	render(): string {
		return `
      <label for="${this.forHTML}" class="block text-sm font-medium text-gray-700">
        ${this.text}
      </label>
    `;
	}
}
