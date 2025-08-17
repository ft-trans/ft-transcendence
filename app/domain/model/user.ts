import { isValid, ulid } from "ulid";
import { ErrBadRequest, ErrInternalServer } from "../error";
import { ValueObject } from "./value_object";

export class UserId extends ValueObject<string, "UserId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					userId: "ユーザーIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class UserEmail extends ValueObject<string, "UserEmail"> {
	// https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)
	static readonly PATTERN =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	validate(value: string) {
		if (!UserEmail.PATTERN.test(value)) {
			throw new ErrBadRequest({
				details: {
					userEmail: "メールアドレスの形式が正しくありません",
				},
			});
		}
	}
}

export class User {
	private constructor(
		readonly id: UserId,
		readonly email: UserEmail,
	) {}

	static create(email: UserEmail): User {
		const id = new UserId(ulid());
		return new User(id, email);
	}

	static reconstruct(id: UserId, email: UserEmail): User {
		return new User(id, email);
	}

	isModified(other: User): boolean {
		if (!this.id.equals(other.id)) {
			throw new ErrInternalServer();
		}
		return !this.email.equals(other.email);
	}
}
