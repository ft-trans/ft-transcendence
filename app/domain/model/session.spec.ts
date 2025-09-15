import { ErrBadRequest } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { Session, SessionId, SessionToken } from "./session";
import { UserId } from "./user";

describe("SessionId", () => {
	it("should create a SessionId instance with a valid ULID", () => {
		const validUlid = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
		const sessionId = new SessionId(validUlid);
		expect(sessionId.value).toBe(validUlid);
	});

	it("should throw an error for an invalid ULID", () => {
		const invalidUlid = "invalid-ulid";
		expect(() => new SessionId(invalidUlid)).toThrowError(
			new ErrBadRequest({
				details: {
					sessionId: "セッションIDは有効なULIDである必要があります",
				},
			}),
		);
	});
});

describe("SessionToken", () => {
	it("should create a SessionToken instance with a valid token", () => {
		const validToken = "a".repeat(32);
		const sessionToken = new SessionToken(validToken);
		expect(sessionToken.value).toBe(validToken);
	});

	it("should throw an error for a token shorter than minimum length", () => {
		const shortToken = "short";
		expect(() => new SessionToken(shortToken)).toThrowError(
			new ErrBadRequest({
				details: {
					sessionToken: `セッショントークンは${SessionToken.MIN_LENGTH}文字以上である必要があります`,
				},
			}),
		);
	});

	it("should accept a token exactly at minimum length", () => {
		const minLengthToken = "a".repeat(SessionToken.MIN_LENGTH);
		const sessionToken = new SessionToken(minLengthToken);
		expect(sessionToken.value).toBe(minLengthToken);
	});

	describe("generate", () => {
		it("should generate a valid token", () => {
			const sessionToken = SessionToken.generate();
			expect(sessionToken.value.length).toBeGreaterThanOrEqual(
				SessionToken.MIN_LENGTH,
			);
		});

		it("should generate different tokens each time", () => {
			const token1 = SessionToken.generate();
			const token2 = SessionToken.generate();
			expect(token1.value).not.toBe(token2.value);
		});
	});

	describe("hash", () => {
		it("should hash the token", () => {
			const sessionToken = new SessionToken("a".repeat(32));
			const hashedToken = sessionToken.hash();

			expect(hashedToken).not.toBe(sessionToken.value);
			expect(hashedToken.length).toBeGreaterThan(0);
		});

		it("should generate different hashes for same token", () => {
			const token1 = new SessionToken("a".repeat(32));
			const token2 = new SessionToken("a".repeat(32));
			const hash1 = token1.hash();
			const hash2 = token2.hash();

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("isCorrect", () => {
		it("should return true for correct token", () => {
			const plainToken = "a".repeat(32);
			const sessionToken = new SessionToken(plainToken);
			const hashedToken = sessionToken.hash();

			expect(
				SessionToken.isCorrect({
					plainToken,
					hashedToken,
				}),
			).toBe(true);
		});

		it("should return false for incorrect token", () => {
			const plainToken = "a".repeat(32);
			const wrongToken = "b".repeat(32);
			const sessionToken = new SessionToken(plainToken);
			const hashedToken = sessionToken.hash();

			expect(
				SessionToken.isCorrect({
					plainToken: wrongToken,
					hashedToken,
				}),
			).toBe(false);
		});
	});
});

describe("Session", () => {
	const userId = new UserId(ulid());
	const token = SessionToken.generate();
	const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
	const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

	describe("create", () => {
		it("should create a session with generated id and hashed token", () => {
			const session = Session.create(userId, token);

			expect(session.userId).toBe(userId);
			expect(session.expiresAt).toBeInstanceOf(Date);
			expect(session.tokenDigest).not.toBe(token.value);
			expect(session.tokenDigest.length).toBeGreaterThan(0);
		});
	});

	describe("reconstruct", () => {
		it("should reconstruct a session with provided values", () => {
			const sessionId = new SessionId("01ARZ3NDEKTSV4RRFFQ69G5FAV");
			const tokenDigest = "hashedTokenDigest";

			const session = Session.reconstruct(
				sessionId,
				userId,
				tokenDigest,
				futureDate,
			);

			expect(session.id).toBe(sessionId);
			expect(session.userId).toBe(userId);
			expect(session.tokenDigest).toBe(tokenDigest);
			expect(session.expiresAt).toBe(futureDate);
		});
	});

	describe("isValid", () => {
		it("should return true for valid token and non-expired session", () => {
			const session = Session.create(userId, token);
			expect(session.isValid(token)).toBe(true);
		});

		it("should return false for invalid token", () => {
			const session = Session.create(userId, token);
			const wrongToken = SessionToken.generate();
			expect(session.isValid(wrongToken)).toBe(false);
		});

		it("should return false for expired session even with correct token", () => {
			const sessionId = new SessionId(ulid());
			const tokenDigest = token.hash();
			const session = Session.reconstruct(sessionId, userId, tokenDigest, pastDate);
			expect(session.isValid(token)).toBe(false);
		});

		it("should return false for expired session with wrong token", () => {
			const sessionId = new SessionId(ulid());
			const tokenDigest = token.hash();
			const session = Session.reconstruct(sessionId, userId, tokenDigest, pastDate);
			const wrongToken = SessionToken.generate();
			expect(session.isValid(wrongToken)).toBe(false);
		});
	});
});
