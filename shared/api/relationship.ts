import { z } from "zod";

export const getFriendsRequestSchema = z.object({});
export type GetFriendsRequest = Record<string, never>;
export type GetFriendsResponse = {
	friends: {
		id: string;
		name: string;
	}[];
};

export const sendFriendRequestSchema = z.object({
	userId: z.string(),
});
export type SendFriendRequestRequest = {
	userId: string;
};
export type SendFriendRequestResponse = Record<string, never>;

export const respondToFriendRequestSchema = z.object({
	status: z.enum(["accepted", "rejected"]),
});
export type RespondToFriendRequestRequest = {
	status: "accepted" | "rejected";
};
export type RespondToFriendRequestResponse = Record<string, never>;

export const removeFriendRequestSchema = z.object({});
export type RemoveFriendRequest = Record<string, never>;
export type RemoveFriendResponse = Record<string, never>;

export const blockUserRequestSchema = z.object({
	userId: z.string(),
});
export type BlockUserRequest = {
	userId: string;
};
export type BlockUserResponse = Record<string, never>;

export const unblockUserRequestSchema = z.object({});
export type UnblockUserRequest = Record<string, never>;
export type UnblockUserResponse = Record<string, never>;
