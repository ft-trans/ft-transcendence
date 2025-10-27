import { ErrBadRequest } from "@domain/error";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import type { CreateTournamentUsecase } from "@usecase/tournament/create_tournament_usecase";
import type { GetTournamentUsecase } from "@usecase/tournament/get_tournament_usecase";
import type { GetTournamentsUsecase } from "@usecase/tournament/get_tournaments_usecase";
import type { RegisterTournamentUsecase } from "@usecase/tournament/register_tournament_usecase";
import type { StartTournamentUsecase } from "@usecase/tournament/start_tournament_usecase";
import type { UnregisterTournamentUsecase } from "@usecase/tournament/unregister_tournament_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type CreateTournamentRequest,
	createTournamentFormSchema,
} from "shared/api/tournament";

export const tournamentController = (
	createTournamentUsecase: CreateTournamentUsecase,
	getTournamentUsecase: GetTournamentUsecase,
	getTournamentsUsecase: GetTournamentsUsecase,
	registerTournamentUsecase: RegisterTournamentUsecase,
	unregisterTournamentUsecase: UnregisterTournamentUsecase,
	startTournamentUsecase: StartTournamentUsecase,
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
		fastify.get(
			"/tournaments",
			{ preHandler: authPrehandler },
			onGetList(getTournamentsUsecase),
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
		fastify.post(
			"/tournaments/:tournamentId/start",
			{ preHandler: authPrehandler },
			onStart(startTournamentUsecase),
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
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
		}
		const input = createTournamentFormSchema.safeParse({
			maxParticipants: req.body.tournament.maxParticipants,
		});
		if (!input.success) {
			throw new ErrBadRequest({
				userMessage: "無効な入力です",
			});
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

const onGetList = (usecase: GetTournamentsUsecase) => {
	return async (_req: FastifyRequest, reply: FastifyReply) => {
		const result = await usecase.execute();
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
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
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
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
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

const onStart = (usecase: StartTournamentUsecase) => {
	return async (
		req: FastifyRequest<{ Params: { tournamentId: string } }>,
		reply: FastifyReply,
	) => {
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
		}
		const result = await usecase.execute({
			tournamentId: req.params.tournamentId,
			organizerId: userId,
		});

		return reply.send({
			tournament: {
				id: result.tournament.id.value,
				organizerId: result.tournament.organizerId.value,
				status: result.tournament.status.value,
				maxParticipants: result.tournament.maxParticipants.value,
			},
			firstRound: {
				id: result.firstRound.id.value,
				tournamentId: result.firstRound.tournamentId.value,
				roundNumber: result.firstRound.roundNumber.value,
				status: result.firstRound.status.value,
			},
			matches: result.matches.map((m) => ({
				id: m.id.value,
				tournamentId: m.tournamentId.value,
				roundId: m.roundId.value,
				participantIds: m.participantIds.map((pid) => pid.value),
				matchId: m.matchId || undefined,
				winnerId: m.winnerId?.value || undefined,
				status: m.status.value,
			})),
		});
	};
};
