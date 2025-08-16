import { ulid } from "ulid";
import { User } from './user';

export class MatchHistory {
  constructor(
    public readonly id: string,
    public readonly winner: User,
    public readonly loser: User,
    public readonly winnerScore: number,
    public readonly loserScore: number,
    public readonly playedAt: Date,
  ) {}

   public static create(
    winner: User,
    loser: User,
    winnerScore: number,
    loserScore: number,
  ): MatchHistory {
     const id = ulid();
     return new MatchHistory(id, winner, loser, winnerScore, loserScore, new Date());
   }
}
