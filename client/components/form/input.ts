import { Component } from "../component";

type Props = {
	id: string;
	name: string;
	type: string;
	autocomplete?: string;
	placeholder?: string;
};

export class Input extends Component {
	private readonly id: string;
	private readonly name: string;
	private readonly type: string;
	private readonly autocomplete: string | undefined;
	private readonly placeholder: string | undefined;

	constructor({ id, name, type, autocomplete, placeholder }: Props) {
		super();
		this.id = id;
		this.name = name;
		this.type = type;
		this.autocomplete = autocomplete;
		this.placeholder = placeholder;
	}

	render(): string {
		return `
      <input
        id="${this.id}"
        name="${this.name}"
        type="${this.type}"
        autocomplete="${this.autocomplete}"
        class="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="${this.placeholder || ""}"
      />
    `;
	}
}
