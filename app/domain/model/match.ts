import { ulid } from "ulid";
import { User } from './user';

export type MatchStatus = 'in_progress' | 'completed';
export type GameType = 'Pong';

export class Match {
  constructor(
    public readonly id: string,
    public readonly participants: User[],
    public status: MatchStatus,
    public readonly gameType: GameType,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public static create(participants: User[], gameType: GameType = 'Pong'): Match {
    if (participants.length < 2) {
        throw new Error('A match requires at least 2 participants.');
    }
    const id = ulid();
    return new Match(id, participants, 'in_progress', gameType, new Date(), new Date());
  }

  public complete(): void {
    this.status = 'completed';
    this.updatedAt = new Date();
  }
}
