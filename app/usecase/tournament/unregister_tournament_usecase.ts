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

export class UnregisterTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: UnregisterTournamentUsecaseInput,
	): Promise<TournamentParticipant> {
		const tournamentId = new TournamentId(input.tournamentId);
		const userId = new UserId(input.userId);

		const participant = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

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

			return deletedParticipant;
		});

		return participant;
	}
}
