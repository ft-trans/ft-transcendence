import crypto from "node:crypto";
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
		return crypto.createHash("sha256").update(this.value).digest("hex");
	}

	matchesWith(hashedToken: string): boolean {
		return this.hash() === hashedToken;
	}
}

export class Session {
	static readonly EXPIRES_IN_DAYS = 7;

	private constructor(
		readonly id: SessionId,
		readonly userId: UserId,
		readonly tokenDigest: string,
		readonly expiresAt: Date,
	) {}

	static create(userId: UserId, token: SessionToken): Session {
		const id = new SessionId(ulid());
		const tokenDigest = token.hash();
		const expiresAt = new Date(
			Date.now() + Session.EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
		);
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
		return token.matchesWith(this.tokenDigest);
	}
}
