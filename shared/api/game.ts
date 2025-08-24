import { z } from "zod";

export const joinMatchmakingRequestSchema = z.object({});
export type JoinMatchmakingRequest = Record<string, never>;
export type JoinMatchmakingResponse = Record<string, never>;

export const leaveMatchmakingRequestSchema = z.object({});
export type LeaveMatchmakingRequest = Record<string, never>;
export type LeaveMatchmakingResponse = Record<string, never>;

export const inviteToGameRequestSchema = z.object({
	userId: z.string(),
});
export type InviteToGameRequest = {
	userId: string;
};
export type InviteToGameResponse = {
	inviteCode: string;
};

export const joinPrivateMatchRequestSchema = z.object({
	inviteCode: z.string(),
});
export type JoinPrivateMatchRequest = {
	inviteCode: string;
};
export type JoinPrivateMatchResponse = Record<string, never>;
