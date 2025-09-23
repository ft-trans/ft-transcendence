import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { Password } from "./password";
import {
	User,
	UserAvatar,
	UserEmail,
	UserId,
	Username,
	type UserStatus,
	UserStatusValue,
} from "./user";

describe("UserId", () => {
	it("should create a UserId instance with a valid ULID", () => {
		const validUlid = ulid();
		expect(() => new UserId(validUlid)).not.toThrow();
	});

	it("should throw a BadRequestError for an invalid ULID", () => {
		const invalidUlid = "invalid-ulid";
		expect(() => new UserId(invalidUlid)).toThrowError(
			new ErrBadRequest({
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

describe("Username", () => {
	it("should create a Username instance with a valid username", () => {
		const validUsername = "testuser123";
		const username = new Username(validUsername);
		expect(username.value).toBe(validUsername);
	});

	it("should throw a BadRequestError for an invalid username", () => {
		const invalidUsernames = ["", "a".repeat(31), "user@name", "user name"];
		for (const invalidUsername of invalidUsernames) {
			expect(() => new Username(invalidUsername)).toThrowError(ErrBadRequest);
		}
	});
});

describe("UserAvatar", () => {
	it("should create a UserAvatar instance with a valid path", () => {
		const validPath = "path/to/avatar.jpg";
		const avatar = new UserAvatar(validPath);
		expect(avatar.value).toBe(validPath);
	});

	it("should allow empty string for default avatar", () => {
		const avatar = new UserAvatar("");
		expect(avatar.value).toBe("");
	});

	it("should throw a BadRequestError for a path that is too long", () => {
		const longPath = "a".repeat(501);
		expect(() => new UserAvatar(longPath)).toThrowError(ErrBadRequest);
	});
});

describe("UserStatusValue", () => {
	it("should create a UserStatusValue instance with valid status", () => {
		const onlineStatus = new UserStatusValue("online");
		const offlineStatus = new UserStatusValue("offline");
		expect(onlineStatus.value).toBe("online");
		expect(offlineStatus.value).toBe("offline");
	});

	it("should throw a BadRequestError for invalid status", () => {
		expect(
			() => new UserStatusValue("invalid" as unknown as UserStatus),
		).toThrowError(ErrBadRequest);
	});
});

describe("User", () => {
	it("should create a user with a valid id and email", () => {
		const userEmail = new UserEmail("test@example.com");
		const username = new Username("testuser");
		const user = User.create(userEmail, username);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeInstanceOf(UserId);
		expect(user.email).toBe(userEmail);
		expect(user.username).toBe(username);
		expect(user.avatar).toBeInstanceOf(UserAvatar);
		expect(user.status).toBeInstanceOf(UserStatusValue);
		expect(user.status.value).toBe("offline");
	});

	it("should reconstruct a user with a given id and email", () => {
		const userId = new UserId(ulid());
		const userEmail = new UserEmail("reconstructed@example.com");
		const username = new Username("testuser");
		const avatar = new UserAvatar("path/to/avatar.jpg");
		const status = new UserStatusValue("online");
		const user = User.reconstruct(userId, userEmail, username, avatar, status);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBe(userId);
		expect(user.email).toBe(userEmail);
		expect(user.username).toBe(username);
		expect(user.avatar).toBe(avatar);
		expect(user.status).toBe(status);
	});

	it("should correctly compare two User instances with isModified method", () => {
		const userEmail = new UserEmail("test@example.com");
		const username = new Username("testuser");
		const user1 = User.create(userEmail, username);
		const user2 = User.reconstruct(
			user1.id,
			user1.email,
			user1.username,
			user1.avatar,
			user1.status,
		);
		const user3 = User.create(userEmail, username);
		const user4 = User.reconstruct(
			user1.id,
			new UserEmail("another@example.com"),
			username,
			user1.avatar,
			user1.status,
		);

		expect(user1.isModified(user2)).toBe(false);
		expect(() => user1.isModified(user3)).toThrowError(new ErrInternalServer());
		expect(user1.isModified(user4)).toBe(true);
	});

	describe("authenticated", () => {
		it("should return true when password matches the digest", () => {
			const plainPassword = "testPassword123";
			const password = new Password(plainPassword);
			const passwordDigest = password.hash();
			const user = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("test@example.com"),
				new Username("testuser"),
				new UserAvatar(""),
				new UserStatusValue("offline"),
				passwordDigest,
			);

			expect(user.authenticated(plainPassword)).toBe(true);
		});

		it("should return false when password does not match the digest", () => {
			const plainPassword = "testPassword123";
			const wrongPassword = "wrongPassword456";
			const password = new Password(plainPassword);
			const passwordDigest = password.hash();
			const user = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("test@example.com"),
				new Username("testuser"),
				new UserAvatar(""),
				new UserStatusValue("offline"),
				passwordDigest,
			);

			expect(user.authenticated(wrongPassword)).toBe(false);
		});

		it("should return false when user has no password digest", () => {
			const user = User.create(
				new UserEmail("test@example.com"),
				new Username("testuser"),
			);

			expect(user.authenticated("anyPassword")).toBe(false);
		});

		it("should return false when user has undefined password digest", () => {
			const user = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("test@example.com"),
				new Username("testuser"),
				new UserAvatar(""),
				new UserStatusValue("offline"),
				undefined,
			);

			expect(user.authenticated("anyPassword")).toBe(false);
		});
	});
});
