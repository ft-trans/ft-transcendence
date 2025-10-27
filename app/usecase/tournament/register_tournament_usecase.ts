import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import type { User } from "@domain/model";
import { TournamentId, TournamentParticipant, UserId } from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import type { ITransaction } from "@usecase/transaction";

export type RegisterTournamentUsecaseInput = {
	tournamentId: string;
	userId: string;
};

export type RegisterTournamentUsecaseOutput = {
	participant: TournamentParticipant;
	user: User;
};

export class RegisterTournamentUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: RegisterTournamentUsecaseInput,
	): Promise<RegisterTournamentUsecaseOutput> {
		const tournamentId = new TournamentId(input.tournamentId);
		const userId = new UserId(input.userId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const friendshipRepo = repo.newFriendshipRepository();
			const userRepo = repo.newUserRepository();

			// トーナメントの存在確認
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// トーナメントが登録受付中か確認
			if (!tournament.canRegister()) {
				throw new ErrBadRequest({
					userMessage: "このトーナメントは現在参加登録を受け付けていません",
				});
			}

			// 既に参加済みでないか確認
			const existingParticipant =
				await tournamentRepo.findParticipantByTournamentAndUserId(
					tournamentId,
					userId.value,
				);
			if (existingParticipant) {
				throw new ErrBadRequest({
					userMessage: "既にこのトーナメントに参加しています",
				});
			}

			// 定員チェック（エンティティのメソッドを使用）
			const participants =
				await tournamentRepo.findParticipantsByTournamentId(tournamentId);
			if (tournament.isFull(participants.length)) {
				throw new ErrBadRequest({
					userMessage: "このトーナメントは定員に達しています",
				});
			}

			// ブロックされていないかチェック
			const friendship = await friendshipRepo.findByUserIds(
				tournament.organizerId.value,
				userId.value,
			);
			if (friendship?.isBlocked()) {
				throw new ErrBadRequest({
					userMessage: "このトーナメントに参加することはできません",
				});
			}

			// 参加者を作成
			const newParticipant = TournamentParticipant.create(tournamentId, userId);
			const createdParticipant =
				await tournamentRepo.createParticipant(newParticipant);
			if (!createdParticipant) {
				throw new ErrInternalServer();
			}

			// ユーザー情報を取得
			const user = await userRepo.findById(userId);
			if (!user) {
				throw new ErrBadRequest({
					userMessage: "ユーザーが見つかりません",
				});
			}

			return { participant: createdParticipant, user };
		});

		const { participant, user } = result;

		// WebSocket通知: 参加者追加
		if (this.tournamentClientRepository) {
			const clients =
				this.tournamentClientRepository.findByTournamentId(tournamentId);
			for (const client of clients) {
				try {
					client.send({
						type: TOURNAMENT_WS_EVENTS.PARTICIPANT_JOINED,
						payload: {
							tournamentId: tournamentId.value,
							participant: {
								id: participant.id.value,
								tournamentId: participant.tournamentId.value,
								userId: participant.userId.value,
								user: {
									id: user.id.value,
									username: user.username.value,
									avatar: user.avatar.value,
								},
								status: participant.status.value,
							},
						},
					});
				} catch (error) {
					console.error(
						"[RegisterTournamentUsecase] Failed to send participant_joined event:",
						error,
					);
				}
			}
		}

		return { participant, user };
	}
}
