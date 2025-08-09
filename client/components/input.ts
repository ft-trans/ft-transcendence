import { Component } from "./component";

type Props = {
	id: string;
	name: string;
	type: string;
	autocomplete?: string;
	placeholder?: string;
};

export class Input extends Component {
	render({ id, name, type, autocomplete, placeholder }: Props): string {
		return `
      <input
        id="${id}"
        name="${name}"
        type="${type}"
        autocomplete="${autocomplete}"
        required
        class="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="${placeholder || ""}"
      />
    `;
	}
}
