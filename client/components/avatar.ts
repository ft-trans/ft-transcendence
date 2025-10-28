import { Component } from "./component";

type Props = {
	src: string | undefined;
	size: number;
	alt?: string;
	extraClass?: string;
};

export class Avatar extends Component {
	private readonly src: string | undefined;
	private readonly size: number;
	private readonly alt?: string;
	private readonly extraClass?: string;

	constructor({ src, size = 10, alt, extraClass }: Props) {
		super();
		this.src = src;
		this.size = size;
		this.alt = alt;
		this.extraClass = extraClass;
	}

	render(): string {
		const defaultAvatar = "/avatars/default.svg";
		return `
        <img
          src="${this.src ? this.src : defaultAvatar}"
          alt="${this.alt ? this.alt : "User Avatar"}"
          class="w-${this.size} h-${this.size} rounded-full object-cover ${this.extraClass ? this.extraClass : ""}"
		  onerror="this.src='${defaultAvatar}'"
        />
        `;
	}
}
