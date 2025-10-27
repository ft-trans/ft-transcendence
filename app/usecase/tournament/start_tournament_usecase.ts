import { ErrBadRequest } from "@domain/error";
import type { Tournament, TournamentMatch } from "@domain/model";
import {
	RoundNumber,
	TournamentId,
	TournamentRound,
	UserId,
} from "@domain/model";
import type { ITournamentClientRepository } from "@domain/repository/tournament_client_repository";
import { TournamentBracketService } from "@domain/service";
import { TOURNAMENT_WS_EVENTS } from "@shared/api/tournament";
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
	constructor(
		private readonly tx: ITransaction,
		private readonly tournamentClientRepository?: ITournamentClientRepository,
	) {}

	async execute(
		input: StartTournamentUsecaseInput,
	): Promise<StartTournamentUsecaseOutput> {
		const tournamentId = new TournamentId(input.tournamentId);
		const organizerId = new UserId(input.organizerId);

		const result = await this.tx.exec(async (repo) => {
			const tournamentRepo = repo.newTournamentRepository();

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
			const matches = bracketService.generateFirstRoundMatches(
				tournamentId,
				createdRound.id,
				participants.map((p) => p.id),
			);

			// 試合を作成
			const createdMatches = await Promise.all(
				matches.map((match) => tournamentRepo.createMatch(match)),
			);

			return {
				tournament: startedTournament,
				firstRound: createdRound,
				matches: createdMatches,
			};
		});

		// WebSocket通知: トーナメント開始
		if (this.tournamentClientRepository) {
			const clients =
				this.tournamentClientRepository.findByTournamentId(tournamentId);
			for (const client of clients) {
				try {
					// TODO: DTOに変換するヘルパー関数を作成する
					client.send({
						type: TOURNAMENT_WS_EVENTS.TOURNAMENT_STARTED,
						payload: {
							tournamentId: tournamentId.value,
							tournament: {
								id: result.tournament.id.value,
								name: result.tournament.id.value, // TODO: name フィールドを追加
								organizerId: result.tournament.organizerId.value,
								organizer: {
									id: result.tournament.organizerId.value,
									username: "", // TODO: ユーザー情報から取得
									avatar: "", // TODO: ユーザー情報から取得
								},
								status: result.tournament.status.value,
								maxParticipants: result.tournament.maxParticipants.value,
								participantCount: 0, // TODO: 参加者数を取得
								createdAt: new Date().toISOString(),
								updatedAt: new Date().toISOString(),
							},
							firstRound: {
								id: result.firstRound.id.value,
								tournamentId: result.firstRound.tournamentId.value,
								roundNumber: result.firstRound.roundNumber.value,
								status: result.firstRound.status.value,
								matches: [], // TODO: matchesを変換
								createdAt: new Date().toISOString(),
							},
						},
					});
				} catch (error) {
					console.error(
						"[StartTournamentUsecase] Failed to send tournament_started event:",
						error,
					);
				}
			}
		}

		return result;
	}
}
