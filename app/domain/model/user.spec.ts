import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { User, UserId, UserName } from "./user";

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

describe("UserName", () => {
	it("should create a UserName instance with a valid name", () => {
		const validName = "test_user";
		const userName = new UserName(validName);
		expect(userName.value).toBe(validName);
	});

	it("should throw a BadRequestError for a name with invalid characters", () => {
		const invalidNames = ["test-user!", " ", ""];
		for (const invalidName of invalidNames) {
			expect(() => new UserName(invalidName)).toThrow(
				expect.objectContaining({
					name: "BadRequestError",
					details: {
						userName:
							"ユーザー名は英数字とアンダースコアのみを含む必要があります",
					},
				}),
			);
		}
	});

	it("should throw a BadRequestError for a name that is too short", () => {
		const shortName = "a".repeat(UserName.MIN_LENGTH - 1);
		expect(() => new UserName(shortName)).toThrow(
			expect.objectContaining({
				name: "BadRequestError",
				details: {
					userName: `ユーザー名は${UserName.MIN_LENGTH}文字以上、${UserName.MAX_LENGTH}文字以下である必要があります`,
				},
			}),
		);
	});

	it("should throw a BadRequestError for a name that is too long", () => {
		const longName = "a".repeat(UserName.MAX_LENGTH + 1);
		expect(() => new UserName(longName)).toThrow(
			expect.objectContaining({
				name: "BadRequestError",
				details: {
					userName: `ユーザー名は${UserName.MIN_LENGTH}文字以上、${UserName.MAX_LENGTH}文字以下である必要があります`,
				},
			}),
		);
	});

	it("should correctly compare two UserName instances with equals method", () => {
		const name1 = new UserName("test_user");
		const name2 = new UserName("test_user");
		const name3 = new UserName("another_user");
		expect(name1.equals(name2)).toBe(true);
		expect(name1.equals(name3)).toBe(false);
	});
});

describe("User", () => {
	it("should create a user with a valid id and name", () => {
		const userName = new UserName("test_user");
		const user = User.create(userName);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBeInstanceOf(UserId);
		expect(user.name).toBe(userName);
	});

	it("should reconstruct a user with a given id and name", () => {
		const userId = new UserId(ulid());
		const userName = new UserName("reconstructed_user");
		const user = User.reconstruct(userId, userName);

		expect(user).toBeInstanceOf(User);
		expect(user.id).toBe(userId);
		expect(user.name).toBe(userName);
	});
});
