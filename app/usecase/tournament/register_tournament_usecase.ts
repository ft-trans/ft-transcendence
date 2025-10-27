import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { TournamentId, TournamentParticipant, UserId } from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
import type { ITransaction } from "@usecase/transaction";

export type RegisterTournamentUsecaseInput = {
	tournamentId: string;
	userId: string;
};

export class RegisterTournamentUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: RegisterTournamentUsecaseInput,
	): Promise<TournamentParticipant> {
		const tournamentId = new TournamentId(input.tournamentId);
		const userId = new UserId(input.userId);

		const participant = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const friendshipRepo = repo.newFriendshipRepository();

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

			return createdParticipant;
		});

		// WebSocket通知: 参加者追加
		if (this.tournamentClientRepository) {
			const clients =
				this.tournamentClientRepository.findByTournamentId(tournamentId);
			for (const client of clients) {
				try {
					// TODO: ユーザー情報を取得してDTOに変換する
					client.send({
						type: TOURNAMENT_WS_EVENTS.PARTICIPANT_JOINED,
						payload: {
							tournamentId: tournamentId.value,
							participant: {
								id: participant.id.value,
								tournamentId: participant.tournamentId.value,
								userId: participant.userId.value,
								user: {
									id: participant.userId.value,
									username: "", // TODO: ユーザー情報から取得
									avatar: "", // TODO: ユーザー情報から取得
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

		return participant;
	}
}
