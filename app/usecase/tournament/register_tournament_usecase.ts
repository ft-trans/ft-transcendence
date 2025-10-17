import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { TournamentId, TournamentParticipant, UserId } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type RegisterTournamentUsecaseInput = {
	tournamentId: string;
	userId: string;
};

export class RegisterTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: RegisterTournamentUsecaseInput,
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

			// 参加者を作成
			const newParticipant = TournamentParticipant.create(tournamentId, userId);
			const createdParticipant =
				await tournamentRepo.createParticipant(newParticipant);
			if (!createdParticipant) {
				throw new ErrInternalServer();
			}

			return createdParticipant;
		});

		return participant;
	}
}
