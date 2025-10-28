import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import {
	TournamentId,
	type TournamentParticipant,
	UserId,
} from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type UnregisterTournamentUsecaseInput = {
	tournamentId: string;
	userId: string;
};

import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";

export class UnregisterTournamentUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: UnregisterTournamentUsecaseInput,
	): Promise<TournamentParticipant> {
		const tournamentId = new TournamentId(input.tournamentId);
		const userId = new UserId(input.userId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const userRepo = repo.newUserRepository();

			// トーナメントの存在確認
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// トーナメントが登録受付中か確認（開始後は取消不可）
			if (!tournament.canRegister()) {
				throw new ErrBadRequest({
					userMessage: "開始後のトーナメントからは退出できません",
				});
			}

			// 参加者が存在するか確認
			const participant =
				await tournamentRepo.findParticipantByTournamentAndUserId(
					tournamentId,
					userId.value,
				);
			if (!participant) {
				throw new ErrBadRequest({
					userMessage: "このトーナメントに参加していません",
				});
			}

			// 参加者を削除
			const deletedParticipant = await tournamentRepo.deleteParticipant(
				participant.id,
			);
			if (!deletedParticipant) {
				throw new ErrInternalServer();
			}

			// 参加者を取得
			// ユーザー情報を取得
			const user = await userRepo.findById(userId);
			if (!user) {
				throw new ErrBadRequest({
					userMessage: "ユーザーが見つかりません",
				});
			}

			return { participant: deletedParticipant, user };
		});

		const { participant, user } = result;

		// WebSocket通知: 参加者削除
		if (this.tournamentClientRepository) {
			const clients =
				this.tournamentClientRepository.findByTournamentId(tournamentId);
			for (const client of clients) {
				try {
					client.send({
						type: TOURNAMENT_WS_EVENTS.PARTICIPANT_LEFT,
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
						"[RegisterTournamentUsecase] Failed to send participant_left event:",
						error,
					);
				}
			}
		}

		return participant;
	}
}
