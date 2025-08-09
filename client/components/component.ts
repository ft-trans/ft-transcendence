export abstract class Component {
	abstract render(props: unknown): string;

	addEventListeners(): void {}
}
