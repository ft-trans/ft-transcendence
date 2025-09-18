import type { Keys } from "path-to-regexp";

export type RouteParams = {
	[key: string]: string;
};

export const createRouteParams = (
	keys: Keys,
	match: RegExpExecArray,
): RouteParams => {
	const params: RouteParams = {};
	keys.forEach((key, index) => {
		params[key.name] = match[index + 1];
	});
	return params;
};

export abstract class Component {
	abstract render(): string;

	onload(_params: RouteParams): void {}
}
