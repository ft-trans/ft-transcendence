import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { CreateTournamentUsecase } from "@usecase/tournament/create_tournament_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type CreateTournamentRequest,
	createTournamentFormSchema,
} from "shared/api/tournament";

export const tournamentController = (
	createTournamentUsecase: CreateTournamentUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post(
			"/tournaments",
			{ preHandler: authPrehandler },
			onCreate(createTournamentUsecase),
		);
	};
};

const onCreate = (usecase: CreateTournamentUsecase) => {
	return async (
		req: FastifyRequest<{ Body: CreateTournamentRequest }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		const input = createTournamentFormSchema.safeParse({
			maxParticipants: req.body.tournament.maxParticipants,
		});
		if (!input.success) {
			return reply.status(400).send({ message: "Invalid input" });
		}
		const tournament = await usecase.execute({
			organizerId: userId,
			maxParticipants: input.data.maxParticipants,
		});
		return reply.send({ tournament });
	};
};
