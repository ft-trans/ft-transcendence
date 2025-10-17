import { z } from "zod";

export type CreateTournamentRequest = {
	tournament: {
		maxParticipants: number;
	};
};

export type CreateTournamentResponse = {
	tournament: {
		id: string;
		organizerId: string;
		maxParticipants: number;
		createdAt: string;
		updatedAt: string;
	};
};

export const createTournamentFormSchema = z.object({
	maxParticipants: z
		.number()
		.min(2, "参加人数は2以上である必要があります")
		.max(64, "参加人数は64以下である必要があります")
		.refine((val) => [2, 4, 8, 16, 32, 64].includes(val), {
			message: "参加人数は2,4,8,16,32,64のいずれかである必要があります",
		}),
});
