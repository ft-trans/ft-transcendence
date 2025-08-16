import { ulid } from "ulid";
import { User } from './user';

export class DirectMessage {
  constructor(
    public readonly id: string,
    public readonly sender: User,
    public readonly receiver: User,
    public readonly content: string,
    public isRead: boolean,
    public readonly sentAt: Date,
  ) {}

   public static create(
    sender: User,
    receiver: User,
    content: string,
   ): DirectMessage {
     if (sender.id === receiver.id) {
       throw new Error('Cannot send a message to oneself.');
     }
     const id = ulid();
     return new DirectMessage(id, sender, receiver, content, false, new Date());
   }

   public markAsRead(): void {
       this.isRead = true;
   }
}
