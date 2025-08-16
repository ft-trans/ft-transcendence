import { User, UserId } from './user';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export class Friendship {
  constructor(
    public readonly requesterId: UserId,
    public readonly receiverId: UserId,
    public status: FriendshipStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public static create(
    requester: User,
    receiver: User,
  ): Friendship {
    if (requester.id === receiver.id) {
      throw new Error('Cannot create a friendship with oneself.');
    }
    return new Friendship(
      requester.id,
      receiver.id,
      'pending',
      new Date(),
      new Date(),
    );
  }

  public accept(): void {
    if (this.status !== 'pending') {
      throw new Error('Cannot accept a friendship that is not pending.');
    }
    this.status = 'accepted';
    this.updatedAt = new Date();
  }
  
  public isAccepted(): boolean {
      return this.status === 'accepted';
  }
}
