import { isValid, ulid } from "ulid";
import { ErrBadRequest } from "../error";
import type { UserId } from "./user";
import { ValueObject } from "./value_object";

export class TournamentId extends ValueObject<string, "TournamentId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentId: "トーナメントIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class TournamentName extends ValueObject<string, "TournamentName"> {
	static readonly MIN_LENGTH = 1;
	static readonly MAX_LENGTH = 100;

	protected validate(value: string): void {
		if (value.length < TournamentName.MIN_LENGTH) {
			throw new ErrBadRequest({
				details: {
					tournamentName: "トーナメント名は1文字以上である必要があります",
				},
			});
		}
		if (value.length > TournamentName.MAX_LENGTH) {
			throw new ErrBadRequest({
				details: {
					tournamentName: `トーナメント名は${TournamentName.MAX_LENGTH}文字以内である必要があります`,
				},
			});
		}
	}
}

export class TournamentDescription extends ValueObject<
	string | undefined,
	"TournamentDescription"
> {
	static readonly MAX_LENGTH = 500;

	protected validate(value: string | undefined): void {
		if (
			value !== undefined &&
			value.length > TournamentDescription.MAX_LENGTH
		) {
			throw new ErrBadRequest({
				details: {
					tournamentDescription: `トーナメント説明は${TournamentDescription.MAX_LENGTH}文字以内である必要があります`,
				},
			});
		}
	}
}

export type TournamentStatus =
	| "registration"
	| "in_progress"
	| "completed"
	| "cancelled";

export class TournamentStatusValue extends ValueObject<
	TournamentStatus,
	"TournamentStatus"
> {
	protected validate(value: TournamentStatus): void {
		const validStatuses: TournamentStatus[] = [
			"registration",
			"in_progress",
			"completed",
			"cancelled",
		];
		if (!validStatuses.includes(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentStatus: "トーナメントステータスが無効です",
				},
			});
		}
	}

	isRegistration(): boolean {
		return this.value === "registration";
	}

	isInProgress(): boolean {
		return this.value === "in_progress";
	}

	isCompleted(): boolean {
		return this.value === "completed";
	}

	isCancelled(): boolean {
		return this.value === "cancelled";
	}

	isActive(): boolean {
		return this.isRegistration() || this.isInProgress();
	}
}

export class MaxParticipants extends ValueObject<number, "MaxParticipants"> {
	static readonly FIXED_PARTICIPANTS = 5;

	protected validate(value: number): void {
		if (value !== MaxParticipants.FIXED_PARTICIPANTS) {
			throw new ErrBadRequest({
				details: {
					maxParticipants: `最大参加者数は${MaxParticipants.FIXED_PARTICIPANTS}人固定です`,
				},
			});
		}
	}
}

export class Tournament {
	constructor(
		readonly id: TournamentId,
		readonly name: TournamentName,
		readonly description: TournamentDescription,
		readonly organizerId: UserId,
		readonly status: TournamentStatusValue,
		readonly maxParticipants: MaxParticipants,
	) {}

	static create(params: {
		name: TournamentName;
		description?: TournamentDescription;
		organizerId: UserId;
	}): Tournament {
		const id = new TournamentId(ulid());
		const maxParticipants = new MaxParticipants(
			MaxParticipants.FIXED_PARTICIPANTS,
		);
		const status = new TournamentStatusValue("registration");
		const description =
			params.description || new TournamentDescription(undefined);

		return new Tournament(
			id,
			params.name,
			description,
			params.organizerId,
			status,
			maxParticipants,
		);
	}

	static reconstruct(params: {
		id: TournamentId;
		name: TournamentName;
		description: TournamentDescription;
		organizerId: UserId;
		status: TournamentStatusValue;
		maxParticipants: MaxParticipants;
	}): Tournament {
		return new Tournament(
			params.id,
			params.name,
			params.description,
			params.organizerId,
			params.status,
			params.maxParticipants,
		);
	}

	start(): Tournament {
		if (!this.status.isRegistration()) {
			throw new ErrBadRequest({
				userMessage: "登録受付中のトーナメントのみ開始できます",
			});
		}

		return new Tournament(
			this.id,
			this.name,
			this.description,
			this.organizerId,
			new TournamentStatusValue("in_progress"),
			this.maxParticipants,
		);
	}

	complete(): Tournament {
		if (!this.status.isInProgress()) {
			throw new ErrBadRequest({
				userMessage: "進行中のトーナメントのみ完了できます",
			});
		}

		return new Tournament(
			this.id,
			this.name,
			this.description,
			this.organizerId,
			new TournamentStatusValue("completed"),
			this.maxParticipants,
		);
	}

	cancel(): Tournament {
		if (this.status.isCompleted()) {
			throw new ErrBadRequest({
				userMessage: "完了したトーナメントはキャンセルできません",
			});
		}
		if (this.status.isCancelled()) {
			throw new ErrBadRequest({
				userMessage: "既にキャンセルされています",
			});
		}

		return new Tournament(
			this.id,
			this.name,
			this.description,
			this.organizerId,
			new TournamentStatusValue("cancelled"),
			this.maxParticipants,
		);
	}

	canRegister(): boolean {
		return this.status.isRegistration();
	}

	canStart(): boolean {
		return this.status.isRegistration();
	}

	canStartWithParticipants(participantCount: number): boolean {
		return this.canStart() && participantCount >= 4;
	}

	isFull(currentParticipantCount: number): boolean {
		return currentParticipantCount >= this.maxParticipants.value;
	}

	isOrganizer(userId: UserId): boolean {
		return this.organizerId.equals(userId);
	}
}

export class TournamentParticipantId extends ValueObject<
	string,
	"TournamentParticipantId"
> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentParticipantId:
						"トーナメント参加者IDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export type TournamentParticipantStatus = "active" | "eliminated" | "withdrawn";

export class TournamentParticipantStatusValue extends ValueObject<
	TournamentParticipantStatus,
	"TournamentParticipantStatus"
> {
	protected validate(value: TournamentParticipantStatus): void {
		const validStatuses: TournamentParticipantStatus[] = [
			"active",
			"eliminated",
			"withdrawn",
		];
		if (!validStatuses.includes(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentParticipantStatus: "参加者ステータスが無効です",
				},
			});
		}
	}

	isActive(): boolean {
		return this.value === "active";
	}

	isEliminated(): boolean {
		return this.value === "eliminated";
	}

	isWithdrawn(): boolean {
		return this.value === "withdrawn";
	}
}

export class TournamentParticipant {
	constructor(
		readonly id: TournamentParticipantId,
		readonly tournamentId: TournamentId,
		readonly userId: UserId,
		readonly status: TournamentParticipantStatusValue,
	) {}

	static create(
		tournamentId: TournamentId,
		userId: UserId,
	): TournamentParticipant {
		const id = new TournamentParticipantId(ulid());
		const status = new TournamentParticipantStatusValue("active");
		return new TournamentParticipant(id, tournamentId, userId, status);
	}

	static reconstruct(
		id: TournamentParticipantId,
		tournamentId: TournamentId,
		userId: UserId,
		status: TournamentParticipantStatusValue,
	): TournamentParticipant {
		return new TournamentParticipant(id, tournamentId, userId, status);
	}

	eliminate(): TournamentParticipant {
		return new TournamentParticipant(
			this.id,
			this.tournamentId,
			this.userId,
			new TournamentParticipantStatusValue("eliminated"),
		);
	}

	withdraw(): TournamentParticipant {
		if (!this.status.isActive()) {
			throw new ErrBadRequest({
				userMessage: "アクティブな参加者のみ棄権できます",
			});
		}
		return new TournamentParticipant(
			this.id,
			this.tournamentId,
			this.userId,
			new TournamentParticipantStatusValue("withdrawn"),
		);
	}

	canCompete(): boolean {
		return this.status.isActive();
	}
}

export class TournamentRoundId extends ValueObject<
	string,
	"TournamentRoundId"
> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentRoundId:
						"トーナメントラウンドIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class RoundNumber extends ValueObject<number, "RoundNumber"> {
	protected validate(value: number): void {
		if (value < 1) {
			throw new ErrBadRequest({
				details: {
					roundNumber: "ラウンド番号は1以上である必要があります",
				},
			});
		}
	}
}

export type TournamentRoundStatus = "pending" | "in_progress" | "completed";

export class TournamentRoundStatusValue extends ValueObject<
	TournamentRoundStatus,
	"TournamentRoundStatus"
> {
	protected validate(value: TournamentRoundStatus): void {
		const validStatuses: TournamentRoundStatus[] = [
			"pending",
			"in_progress",
			"completed",
		];
		if (!validStatuses.includes(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentRoundStatus: "ラウンドステータスが無効です",
				},
			});
		}
	}

	isPending(): boolean {
		return this.value === "pending";
	}

	isInProgress(): boolean {
		return this.value === "in_progress";
	}

	isCompleted(): boolean {
		return this.value === "completed";
	}
}

export class TournamentRound {
	constructor(
		readonly id: TournamentRoundId,
		readonly tournamentId: TournamentId,
		readonly roundNumber: RoundNumber,
		readonly status: TournamentRoundStatusValue,
	) {}

	static create(
		tournamentId: TournamentId,
		roundNumber: RoundNumber,
	): TournamentRound {
		const id = new TournamentRoundId(ulid());
		const status = new TournamentRoundStatusValue("pending");
		return new TournamentRound(id, tournamentId, roundNumber, status);
	}

	static reconstruct(
		id: TournamentRoundId,
		tournamentId: TournamentId,
		roundNumber: RoundNumber,
		status: TournamentRoundStatusValue,
	): TournamentRound {
		return new TournamentRound(id, tournamentId, roundNumber, status);
	}

	start(): TournamentRound {
		if (!this.status.isPending()) {
			throw new ErrBadRequest({
				userMessage: "待機中のラウンドのみ開始できます",
			});
		}
		return new TournamentRound(
			this.id,
			this.tournamentId,
			this.roundNumber,
			new TournamentRoundStatusValue("in_progress"),
		);
	}

	complete(): TournamentRound {
		if (!this.status.isInProgress()) {
			throw new ErrBadRequest({
				userMessage: "進行中のラウンドのみ完了できます",
			});
		}
		return new TournamentRound(
			this.id,
			this.tournamentId,
			this.roundNumber,
			new TournamentRoundStatusValue("completed"),
		);
	}
}

export class TournamentMatchId extends ValueObject<
	string,
	"TournamentMatchId"
> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentMatchId:
						"トーナメント試合IDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export type TournamentMatchStatus = "pending" | "in_progress" | "completed";

export class TournamentMatchStatusValue extends ValueObject<
	TournamentMatchStatus,
	"TournamentMatchStatus"
> {
	protected validate(value: TournamentMatchStatus): void {
		const validStatuses: TournamentMatchStatus[] = [
			"pending",
			"in_progress",
			"completed",
		];
		if (!validStatuses.includes(value)) {
			throw new ErrBadRequest({
				details: {
					tournamentMatchStatus: "試合ステータスが無効です",
				},
			});
		}
	}

	isPending(): boolean {
		return this.value === "pending";
	}

	isInProgress(): boolean {
		return this.value === "in_progress";
	}

	isCompleted(): boolean {
		return this.value === "completed";
	}
}

export class TournamentMatch {
	constructor(
		readonly id: TournamentMatchId,
		readonly tournamentId: TournamentId,
		readonly roundId: TournamentRoundId,
		readonly participantIds: TournamentParticipantId[],
		readonly matchId: string | undefined, // 既存のMatchテーブルとの関連
		readonly winnerId: TournamentParticipantId | undefined,
		readonly status: TournamentMatchStatusValue,
	) {}

	static create(
		tournamentId: TournamentId,
		roundId: TournamentRoundId,
		participantIds: TournamentParticipantId[],
	): TournamentMatch {
		if (participantIds.length !== 2) {
			throw new ErrBadRequest({
				userMessage: "試合には2人の参加者が必要です",
			});
		}

		const id = new TournamentMatchId(ulid());
		const status = new TournamentMatchStatusValue("pending");
		return new TournamentMatch(
			id,
			tournamentId,
			roundId,
			participantIds,
			undefined, // matchId
			undefined, // winnerId
			status,
		);
	}

	static reconstruct(
		id: TournamentMatchId,
		tournamentId: TournamentId,
		roundId: TournamentRoundId,
		participantIds: TournamentParticipantId[],
		matchId: string | undefined,
		winnerId: TournamentParticipantId | undefined,
		status: TournamentMatchStatusValue,
	): TournamentMatch {
		return new TournamentMatch(
			id,
			tournamentId,
			roundId,
			participantIds,
			matchId,
			winnerId,
			status,
		);
	}

	start(matchId: string): TournamentMatch {
		if (!this.status.isPending()) {
			throw new ErrBadRequest({
				userMessage: "待機中の試合のみ開始できます",
			});
		}
		return new TournamentMatch(
			this.id,
			this.tournamentId,
			this.roundId,
			this.participantIds,
			matchId,
			this.winnerId,
			new TournamentMatchStatusValue("in_progress"),
		);
	}

	complete(winnerId: TournamentParticipantId): TournamentMatch {
		if (!this.status.isInProgress()) {
			throw new ErrBadRequest({
				userMessage: "進行中の試合のみ完了できます",
			});
		}

		// Check if winnerId is one of the participants
		const isParticipant = this.participantIds.some((id) => id.equals(winnerId));
		if (!isParticipant) {
			throw new ErrBadRequest({
				userMessage: "勝者は試合の参加者である必要があります",
			});
		}

		return new TournamentMatch(
			this.id,
			this.tournamentId,
			this.roundId,
			this.participantIds,
			this.matchId,
			winnerId,
			new TournamentMatchStatusValue("completed"),
		);
	}
}
