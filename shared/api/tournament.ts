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

export type GetTournamentResponse = {
	tournament: {
		id: string;
		organizerId: string;
		status: string;
		maxParticipants: number;

		participants: {
			id: string;
			userId: string;
			username: string;
			avatarUrl?: string;
			status: string;
		}[];
	};
};

export type GetTournamentsResponse = {
	tournaments: {
		id: string;
		organizerId: string;
		status: string;
		maxParticipants: number;
		organizer: {
			id: string;
			username: string;
			avatarUrl?: string;
		};
	}[];
};

export type RegisterTournamentRequest = {
	tournamentId: string;
	userId: string;
};

export type RegisterTournamentResponse = {
	participant: {
		id: string;
		userId: string;
		tournamentId: string;
		status: string;
	};
};
