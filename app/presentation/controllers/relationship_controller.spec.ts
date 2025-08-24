import { User, UserEmail, UserId } from "@domain/model/user";
import type { GetFriendsUsecase } from "@usecase/relationship/get_friends_usecase";
import Fastify from "fastify";
import { ulid } from "ulid";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { relationshipController } from "./relationship_controller";

const getFriendsUsecase = mock<GetFriendsUsecase>();

const fastify = Fastify();
fastify.register(relationshipController(getFriendsUsecase));

describe("relationshipController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /relationships/friends", () => {
		it("should return a list of friends", async () => {
			const friend1 = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("friend1@example.com"),
			);
			const friend2 = User.reconstruct(
				new UserId(ulid()),
				new UserEmail("friend2@example.com"),
			);
			getFriendsUsecase.execute.mockResolvedValue([friend1, friend2]);

			const response = await fastify.inject({
				method: "GET",
				url: "/relationships/friends",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toEqual({
				friends: [
					{
						id: friend1.id.value,
						email: friend1.email.value,
					},
					{
						id: friend2.id.value,
						email: friend2.email.value,
					},
				],
			});
		});
	});
});
