import { Component } from "./component";

type Props = {
	align?: "left" | "center" | "right";
	text: string;
};

export class SectionTitle extends Component {
	render({ text, align = "center" }: Props): string {
		const alignmentClass =
			align === "left"
				? "text-left"
				: align === "right"
					? "text-right"
					: "text-center";
		return `
      <div class="${alignmentClass} mb-4 mt-2">
        <h2 class="text-4xl font-bold text-gray-900">
          ${text}
        </h2>
      </div>
    `;
	}
}
