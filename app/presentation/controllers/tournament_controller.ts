import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { CreateTournamentUsecase } from "@usecase/tournament/create_tournament_usecase";
import type { GetTournamentUsecase } from "@usecase/tournament/get_tournament_usecase";
import type { RegisterTournamentUsecase } from "@usecase/tournament/register_tournament_usecase";
import type { UnregisterTournamentUsecase } from "@usecase/tournament/unregister_tournament_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type CreateTournamentRequest,
	createTournamentFormSchema,
} from "shared/api/tournament";

export const tournamentController = (
	createTournamentUsecase: CreateTournamentUsecase,
	getTournamentUsecase: GetTournamentUsecase,
	registerTournamentUsecase: RegisterTournamentUsecase,
	unregisterTournamentUsecase: UnregisterTournamentUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.post(
			"/tournaments",
			{ preHandler: authPrehandler },
			onCreate(createTournamentUsecase),
		);
		fastify.get(
			"/tournaments/:tournamentId",
			{ preHandler: authPrehandler },
			onGet(getTournamentUsecase),
		);
		fastify.post(
			"/tournaments/:tournamentId/register",
			{ preHandler: authPrehandler },
			onRegister(registerTournamentUsecase),
		);
		fastify.delete(
			"/tournaments/:tournamentId/register",
			{ preHandler: authPrehandler },
			onUnregister(unregisterTournamentUsecase),
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
		return reply.send({
			tournament: {
				id: tournament.id.value,
				organizerId: tournament.organizerId.value,
				maxParticipants: tournament.maxParticipants,
			},
		});
	};
};

const onGet = (usecase: GetTournamentUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { tournamentId: string } }>,
		reply: FastifyReply,
	) => {
		const result = await usecase.execute({
			tournamentId: req.params.tournamentId,
		});
		return reply.send(result);
	};
};

const onRegister = (usecase: RegisterTournamentUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { tournamentId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		const result = await usecase.execute({
			tournamentId: req.params.tournamentId,
			userId: userId,
		});
		return reply.send({
			participant: {
				id: result.id.value,
				userId: result.userId.value,
				tournamentId: result.tournamentId.value,
				status: result.status.value,
			},
		});
	};
};

const onUnregister = (usecase: UnregisterTournamentUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { tournamentId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			return reply.status(401).send({ message: "Unauthorized" });
		}
		const result = await usecase.execute({
			tournamentId: req.params.tournamentId,
			userId: userId,
		});
		return reply.send({
			participant: {
				id: result.id.value,
				userId: result.userId.value,
				tournamentId: result.tournamentId.value,
				status: result.status.value,
			},
		});
	};
};
