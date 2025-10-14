import { ErrBadRequest } from "@domain/error";
import type { Tournament, TournamentMatch } from "@domain/model";
import {
	Match,
	RoundNumber,
	TournamentId,
	TournamentRound,
	UserId,
} from "@domain/model";
import { TournamentBracketService } from "@domain/service";
import type { ITransaction } from "@usecase/transaction";

export type StartTournamentUsecaseInput = {
	tournamentId: string;
	organizerId: string;
};

export type StartTournamentUsecaseOutput = {
	tournament: Tournament;
	firstRound: TournamentRound;
	matches: TournamentMatch[];
};

export class StartTournamentUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(
		input: StartTournamentUsecaseInput,
	): Promise<StartTournamentUsecaseOutput> {
		const tournamentId = new TournamentId(input.tournamentId);
		const organizerId = new UserId(input.organizerId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();
			const matchRepo = repo.newMatchRepository();
			const userRepo = repo.newUserRepository();

			// トーナメントの存在確認
			const tournament = await tournamentRepo.findById(tournamentId);
			if (!tournament) {
				throw new ErrBadRequest({
					userMessage: "トーナメントが見つかりません",
				});
			}

			// 主催者チェック
			if (!tournament.isOrganizer(organizerId)) {
				throw new ErrBadRequest({
					userMessage: "トーナメントを開始できるのは主催者のみです",
				});
			}

			// 参加者を取得
			const participants =
				await tournamentRepo.findParticipantsByTournamentId(tournamentId);

			// 開始可能かチェック（エンティティのメソッドを使用）
			if (!tournament.canStartWithParticipants(participants.length)) {
				throw new ErrBadRequest({
					userMessage: "トーナメントを開始するには最低2人の参加者が必要です",
				});
			}

			// トーナメントを開始状態に更新
			const startedTournament = tournament.start();
			await tournamentRepo.update(startedTournament);

			// 第1ラウンドを作成
			const firstRound = TournamentRound.create(
				tournamentId,
				new RoundNumber(1),
			);
			const createdRound = await tournamentRepo.createRound(firstRound);

			// ブラケット生成（ドメインサービスを使用）
			const bracketService = new TournamentBracketService();
			const tournamentMatches = bracketService.generateFirstRoundMatches(
				tournamentId,
				createdRound.id,
				participants.map((p) => p.id),
			);

			// 試合を作成
			const createdMatches: TournamentMatch[] = [];
			for (const tm of tournamentMatches) {
				// 参加者のユーザー情報を取得
				const users = await Promise.all(
					tm.participantIds.map(async (pid) => {
						const participant = await tournamentRepo.findParticipantById(pid);
						if (!participant) {
							throw new ErrBadRequest({
								userMessage: "参加者が見つかりません",
							});
						}
						const user = await userRepo.findById(participant.userId);
						if (!user) {
							throw new ErrBadRequest({
								userMessage: "ユーザーが見つかりません",
							});
						}
						return user;
					}),
				);

				// Matchエンティティを作成
				const match = Match.create(users);
				await matchRepo.save(match);

				// TournamentMatchを作成（既に持っているmatchIdを使用）
				// ただし、bracketServiceが既にmatchIdを持っているのでそのまま保存
				const createdMatch = await tournamentRepo.createMatch(tm);
				createdMatches.push(createdMatch);
			}

			return {
				tournament: startedTournament,
				firstRound: createdRound,
				matches: createdMatches,
			};
		});

		return result;
	}
}
