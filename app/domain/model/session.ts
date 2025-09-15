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
	protected validate(value: string): void {
		if (!value || value.length < 32) {
			throw new ErrBadRequest({
				details: {
					sessionToken: "セッショントークンは32文字以上である必要があります",
				},
			});
		}
	}

	static generate(): SessionToken {
		// TODO: generate secure token
		const token = crypto.randomBytes(32).toString("hex");
		return new SessionToken(token);
	}
}

export class Session {
	private constructor(
		readonly id: SessionId,
		readonly userId: UserId,
		readonly token: SessionToken,
		readonly expiresAt: Date,
	) {}

	static create(userId: UserId, token: SessionToken, expiresAt: Date): Session {
		const id = new SessionId(ulid());
		return new Session(id, userId, token, expiresAt);
	}

	static reconstruct(
		id: SessionId,
		userId: UserId,
		token: SessionToken,
		expiresAt: Date,
	): Session {
		return new Session(id, userId, token, expiresAt);
	}

	isExpired(): boolean {
		return new Date() > this.expiresAt;
	}
}
