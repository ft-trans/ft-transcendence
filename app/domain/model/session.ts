import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { isValid, ulid } from "ulid";
import { ErrBadRequest } from "../error";
import type { UserId } from "./user";
import { ValueObject } from "./value_object";

export class SessionId extends ValueObject<string, "SessionId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					sessionId: "セッションIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class SessionToken extends ValueObject<string, "SessionToken"> {
	static readonly MIN_LENGTH = 32;
	static readonly SALT_ROUNDS = 10;

	protected validate(value: string): void {
		if (!value || value.length < SessionToken.MIN_LENGTH) {
			throw new ErrBadRequest({
				details: {
					sessionToken: `セッショントークンは${SessionToken.MIN_LENGTH}文字以上である必要があります`,
				},
			});
		}
	}

	static generate(): SessionToken {
		const token = crypto.randomBytes(32).toString("hex");
		return new SessionToken(token);
	}

	hash(): string {
		return bcrypt.hashSync(this.value, SessionToken.SALT_ROUNDS);
	}

	static isCorrect({
		plainToken,
		hashedToken,
	}: {
		plainToken: string;
		hashedToken: string;
	}): boolean {
		return bcrypt.compareSync(plainToken, hashedToken);
	}
}

export class Session {
	private constructor(
		readonly id: SessionId,
		readonly userId: UserId,
		readonly tokenDigest: string,
		readonly expiresAt: Date,
	) {}

	static create(userId: UserId, token: SessionToken, expiresAt: Date): Session {
		const id = new SessionId(ulid());
		const tokenDigest = token.hash();
		return new Session(id, userId, tokenDigest, expiresAt);
	}

	static reconstruct(
		id: SessionId,
		userId: UserId,
		tokenDigest: string,
		expiresAt: Date,
	): Session {
		return new Session(id, userId, tokenDigest, expiresAt);
	}

	private isExpired(): boolean {
		return new Date() > this.expiresAt;
	}

	isValid(token: SessionToken): boolean {
		if (this.isExpired()) {
			return false;
		}
		return SessionToken.isCorrect({
			plainToken: token.value,
			hashedToken: this.tokenDigest,
		});
	}
}
