import { ErrBadRequest } from "@domain/error";
import { describe, expect, it } from "vitest";
import { Password } from "./password";

describe("Password", () => {
	it("should create a Password instance with a valid password", () => {
		const validPassword = "validPassword123";
		const password = new Password(validPassword);
		expect(password.value).toBe(validPassword);
	});

	it("should throw an error for a password shorter than minimum length", () => {
		const shortPassword = "short";
		expect(() => new Password(shortPassword)).toThrowError(
			new ErrBadRequest({
				details: {
					password: `パスワードは${Password.MIN_LENGTH}文字以上である必要があります`,
				},
			}),
		);
	});

	it("should accept a password exactly at minimum length", () => {
		const minLengthPassword = "a".repeat(Password.MIN_LENGTH);
		const password = new Password(minLengthPassword);
		expect(password.value).toBe(minLengthPassword);
	});

	describe("hash", () => {
		it("should hash the password", () => {
			const password = new Password("testPassword123");
			const hashedPassword = password.hash();

			expect(hashedPassword).not.toBe(password.value);
			expect(hashedPassword.length).toBeGreaterThan(0);
		});

		it("should generate different hashes for same password", () => {
			const password1 = new Password("testPassword123");
			const password2 = new Password("testPassword123");
			const hash1 = password1.hash();
			const hash2 = password2.hash();

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("isCorrect", () => {
		it("should return true for correct password", () => {
			const plainPassword = "testPassword123";
			const password = new Password(plainPassword);
			const hashedPassword = password.hash();

			expect(
				Password.isCorrect({
					plainPassword,
					hashedPassword,
				}),
			).toBe(true);
		});

		it("should return false for incorrect password", () => {
			const plainPassword = "testPassword123";
			const wrongPassword = "wrongPassword456";
			const password = new Password(plainPassword);
			const hashedPassword = password.hash();

			expect(
				Password.isCorrect({
					plainPassword: wrongPassword,
					hashedPassword,
				}),
			).toBe(false);
		});
	});
});