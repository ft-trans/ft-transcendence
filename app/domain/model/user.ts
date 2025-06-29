import { nanoid } from "nanoid";
import { ValueObject } from "./value_object";

export class UserId extends ValueObject<string, "UserId"> {
	constructor(value: string = nanoid()) {
		super(value);
	}

	// accept any string as a valid UserId for now
	protected validate(value: string): void {
		if (value.trim() === "") {
			throw new Error("UserId must be a non-empty string.");
		}
	}
}

export class UserName extends ValueObject<string, "UserName"> {
	static MIN_LENGTH = 3;
	static MAX_LENGTH = 50;

	protected validate(value: string): void {
		if (value.trim() === "") {
			throw new Error("UserName must be a non-empty string.");
		}
		if (
			value.length < UserName.MIN_LENGTH ||
			value.length > UserName.MAX_LENGTH
		) {
			throw new Error(
				`UserName must be between ${UserName.MIN_LENGTH} and ${UserName.MAX_LENGTH} characters long.`,
			);
		}
	}
}

export class User {
	private constructor(
		readonly id: UserId,
		readonly name: UserName,
	) {}

	static create(name: UserName): User {
		const id = new UserId();
		return new User(id, name);
	}

	static reconstruct(id: UserId, name: UserName): User {
		return new User(id, name);
	}

	changeName(name: UserName): User {
		return new User(this.id, name);
	}
}
