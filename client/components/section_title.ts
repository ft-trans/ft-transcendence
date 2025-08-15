import { Component } from "./component";

type Props = {
	align?: "left" | "center" | "right";
	text: string;
};

export class SectionTitle extends Component {
	private readonly align: "left" | "center" | "right";
	private readonly text: string;

	constructor({ text, align = "center" }: Props) {
		super();
		this.text = text;
		this.align = align;
	}

	render(): string {
		const alignmentClass =
			this.align === "left"
				? "text-left"
				: this.align === "right"
					? "text-right"
					: "text-center";
		return `
      <div class="${alignmentClass} mb-4 mt-2">
        <h2 class="text-4xl font-bold text-gray-900">
          ${this.text}
        </h2>
      </div>
    `;
	}
}
