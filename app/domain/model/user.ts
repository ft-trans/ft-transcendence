import { isValid, ulid } from "ulid";
import { BadRequestError } from "../error";
import { ValueObject } from "./value_object";

export class UserId extends ValueObject<string, "UserId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new BadRequestError({
				details: {
					userId: "ユーザーIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class UserName extends ValueObject<string, "UserName"> {
	static MIN_LENGTH = 3;
	static MAX_LENGTH = 50;
	static PATTERN = /^[a-zA-Z0-9_]+$/;

	protected validate(value: string): void {
		if (!UserName.PATTERN.test(value)) {
			throw new BadRequestError({
				details: {
					userName:
						"ユーザー名は英数字とアンダースコアのみを含む必要があります",
				},
			});
		}
		if (
			value.length < UserName.MIN_LENGTH ||
			value.length > UserName.MAX_LENGTH
		) {
			throw new BadRequestError({
				details: {
					userName: `ユーザー名は${UserName.MIN_LENGTH}文字以上、${UserName.MAX_LENGTH}文字以下である必要があります`,
				},
			});
		}
	}
}

export class User {
	private constructor(
		readonly id: UserId,
		readonly name: UserName,
	) {}

	static create(name: UserName): User {
		const id = new UserId(ulid());
		return new User(id, name);
	}

	static reconstruct(id: UserId, name: UserName): User {
		return new User(id, name);
	}
}
