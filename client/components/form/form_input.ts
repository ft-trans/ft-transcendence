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
	render({ id, name, type, autocomplete, labelText }: Props): string {
		return `
      <div>
        ${new Label().render({
					forHTML: id,
					text: labelText,
				})}
        <div class="mt-1">
          ${new Input().render({
						id,
						name,
						type,
						autocomplete,
					})}
        </div>
      </div>
    `;
	}
}
