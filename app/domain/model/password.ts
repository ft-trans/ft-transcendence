import bcrypt from "bcrypt";
import { ErrBadRequest } from "../error";
import { ValueObject } from "./value_object";

export class Password extends ValueObject<string, "Password"> {
	static readonly MIN_LENGTH = 8;
	static readonly SALT_ROUNDS = 10;

	protected validate(value: string): void {
		if (value.length < Password.MIN_LENGTH) {
			throw new ErrBadRequest({
				details: {
					password: `パスワードは${Password.MIN_LENGTH}文字以上である必要があります`,
				},
			});
		}
	}

	hash(): string {
		return bcrypt.hashSync(this.value, Password.SALT_ROUNDS);
	}

	static isCorrect({
		plainPassword,
		hashedPassword,
	}: {
		plainPassword: string;
		hashedPassword: string;
	}): boolean {
		return bcrypt.compareSync(plainPassword, hashedPassword);
	}
}