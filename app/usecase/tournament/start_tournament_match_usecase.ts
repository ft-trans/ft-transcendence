import { ErrBadRequest } from "@domain/error";
import { Match, TournamentMatchId } from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import type { ITransaction } from "@usecase/transaction";

export type StartTournamentMatchUsecaseInput = {
	tournamentMatchId: string;
	userId: string;
};

export type StartTournamentMatchUsecaseOutput = {
	matchId: string;
};

export class StartTournamentMatchUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: StartTournamentMatchUsecaseInput,
	): Promise<StartTournamentMatchUsecaseOutput> {
		const tournamentMatchId = new TournamentMatchId(input.tournamentMatchId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();
			const matchRepo = repo.newMatchRepository();

			// 1. TournamentMatchを取得
			const tournamentMatch =
				await tournamentRepo.findMatchById(tournamentMatchId);
			if (!tournamentMatch) {
				throw new ErrBadRequest({
					userMessage: "トーナメント試合が見つかりません",
				});
			}

			// 2. バリデーション: ステータスが"pending"であることを確認
			if (!tournamentMatch.status.isPending()) {
				throw new ErrBadRequest({
					userMessage: "待機中の試合のみ開始できます",
				});
			}

			// 3. バリデーション: 参加者が2人いることを確認（BYEでない）
			if (tournamentMatch.participantIds.length !== 2) {
				throw new ErrBadRequest({
					userMessage: "試合には2人の参加者が必要です",
				});
			}

			// 4. バリデーション: Tournamentが"in_progress"ステータスであることを確認
			const tournament = await tournamentRepo.findById(
				tournamentMatch.tournamentId,
			);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}
			if (!tournament.status.isInProgress()) {
				throw new ErrBadRequest({
					userMessage: "進行中のトーナメントの試合のみ開始できます",
				});
			}

			// 5. TournamentParticipantからUserを取得
			const participant1 = await tournamentRepo.findParticipantById(
				tournamentMatch.participantIds[0],
			);
			const participant2 = await tournamentRepo.findParticipantById(
				tournamentMatch.participantIds[1],
			);

			if (!participant1 || !participant2) {
				throw new ErrBadRequest({
					userMessage: "参加者情報が見つかりません",
				});
			}

			// 5.5. バリデーション: リクエストユーザーが試合参加者または主催者であることを確認
			const isParticipant =
				participant1.userId.value === input.userId ||
				participant2.userId.value === input.userId;
			const isOrganizer = tournament.organizerId.value === input.userId;

			if (!isParticipant && !isOrganizer) {
				throw new ErrBadRequest({
					userMessage: "試合を開始できるのは試合参加者または主催者のみです",
				});
			}

			const user1 = await userRepo.findById(participant1.userId);
			const user2 = await userRepo.findById(participant2.userId);

			if (!user1 || !user2) {
				throw new ErrBadRequest({
					userMessage: "ユーザーが見つかりません",
				});
			}

			// 6. 通常のMatchを作成（gameType: "Pong"）
			const match = Match.create([user1, user2], "Pong");
			await matchRepo.save(match);

			// 7. TournamentMatch.matchIdに紐づけて"in_progress"に更新
			const startedTournamentMatch = tournamentMatch.start(match.id);
			await tournamentRepo.updateMatch(startedTournamentMatch);

			return {
				matchId: match.id,
				tournamentId: tournament.id,
				startedTournamentMatch,
				participant1,
				participant2,
				user1,
				user2,
			};
		});

		// 8. WebSocketでブロードキャスト
		if (this.tournamentClientRepository) {
			this.tournamentClientRepository.broadcastToTournament(
				result.tournamentId,
				{
					type: TOURNAMENT_WS_EVENTS.MATCH_STARTED,
					payload: {
						tournamentId: result.tournamentId.value,
						tournamentMatchId: result.startedTournamentMatch.id.value,
						matchId: result.matchId,
						match: {
							id: result.startedTournamentMatch.id.value,
							tournamentId: result.tournamentId.value,
							roundId: result.startedTournamentMatch.roundId.value,
							matchId: result.matchId,
							participants: [
								{
									id: result.participant1.id.value,
									tournamentId: result.tournamentId.value,
									userId: result.participant1.userId.value,
									user: {
										id: result.user1.id.value,
										username: result.user1.username.value,
										avatar: result.user1.avatar.value,
									},
									status: result.participant1.status.value,
								},
								{
									id: result.participant2.id.value,
									tournamentId: result.tournamentId.value,
									userId: result.participant2.userId.value,
									user: {
										id: result.user2.id.value,
										username: result.user2.username.value,
										avatar: result.user2.avatar.value,
									},
									status: result.participant2.status.value,
								},
							],
							winnerId: undefined,
							status: result.startedTournamentMatch.status.value,
							completedAt: undefined,
							createdAt: new Date().toISOString(),
						},
					},
				},
			);
		}

		return {
			matchId: result.matchId,
		};
	}
}
