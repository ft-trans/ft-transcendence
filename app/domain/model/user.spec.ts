import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { User, UserEmail, UserId } from "./user";

describe("UserId", () => {
	it("should create a UserId instance with a valid ULID", () => {
		const validUlid = ulid();
		expect(() => new UserId(validUlid)).not.toThrow();
	});

	it("should throw a BadRequestError for an invalid ULID", () => {
		const invalidUlid = "invalid-ulid";
		expect(() => new UserId(invalidUlid)).toThrow(
			expect.objectContaining({
				name: "BadRequestError",
				details: {
					userId: "ユーザーIDは有効なULIDである必要があります",
				},
			}),
		);
	});
});

describe("UserEmail", () => {
	it("should create a UserEmail instance with a valid email", () => {
		const validEmail = "test@example.com";
		const userEmail = new UserEmail(validEmail);
		expect(userEmail.value).toBe(validEmail);
	});

	it("should throw a BadRequestError for an invalid email", () => {
		const invalidEmails = ["invalid-email", "test@", "@example.com", " "];
		for (const invalidEmail of invalidEmails) {
			expect(() => new UserEmail(invalidEmail)).toThrowError(
				new ErrBadRequest({
					details: {
						userEmail: "メールアドレスの形式が正しくありません",
					},
				}),
			);
		}
	});

	it("should correctly compare two UserEmail instances with equals method", () => {
		const email1 = new UserEmail("test@example.com");
		const email2 = new UserEmail("test@example.com");
		const email3 = new UserEmail("another@example.com");
		expect(email1.equals(email2)).toBe(true);
		expect(email1.equals(email3)).toBe(false);
	});
});

describe("User", () => {
	it("should create a user with a valid id and email", () => {
		const userEmail = new UserEmail("test@example.com");
		const user = User.create(userEmail);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeInstanceOf(UserId);
		expect(user.email).toBe(userEmail);
	});

	it("should reconstruct a user with a given id and email", () => {
		const userId = new UserId(ulid());
		const userEmail = new UserEmail("reconstructed@example.com");
		const user = User.reconstruct(userId, userEmail);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBe(userId);
		expect(user.email).toBe(userEmail);
	});

	it("should correctly compare two User instances with isModified method", () => {
		const user1 = User.create(new UserEmail("test@example.com"));
		const user2 = User.reconstruct(user1.id, user1.email);
		const user3 = User.create(user1.email);
		const user4 = User.reconstruct(
			user1.id,
			new UserEmail("another@example.com"),
		);

		expect(user1.isModified(user2)).toBe(false);
		expect(() => user1.isModified(user3)).toThrowError(new ErrInternalServer());
		expect(user1.isModified(user4)).toBe(true);
	});
});
