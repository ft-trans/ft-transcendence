import { Component } from "../component";
import { Input } from "./input";
import { Label } from "./label";

type Props = {
	id: string;
	name: string;
	type: string;
	autocomplete?: string;
	labelText: string;
};

export class FormInput extends Component {
	private readonly id: string;
	private readonly name: string;
	private readonly type: string;
	private readonly autocomplete: string | undefined;
	private readonly labelText: string;

	constructor({ id, name, type, autocomplete, labelText }: Props) {
		super();
		this.id = id;
		this.name = name;
		this.type = type;
		this.autocomplete = autocomplete;
		this.labelText = labelText;
	}

	render(): string {
		return `
      <div>
        ${new Label({
					forHTML: this.id,
					text: this.labelText,
				}).render()}
        <div class="mt-1">
          ${new Input({
						id: this.id,
						name: this.name,
						type: this.type,
						autocomplete: this.autocomplete,
					}).render()}
        </div>
      </div>
    `;
	}
}
