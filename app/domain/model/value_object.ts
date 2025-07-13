import { isEqual } from "lodash-es";

export abstract class ValueObject<T, U> {
	private _type: U;
	protected readonly _value: T;

	constructor(value: T) {
		this.validate(value);
		this._value = value;
	}

	protected abstract validate(value: T): void;

	public get value(): T {
		return this._value;
	}

	public equals(other: ValueObject<T, U>): boolean {
		return isEqual(this._value, other._value);
	}
}
