import type { DirectMessage } from "../model/direct_message";

export interface IDirectMessageRepository {
	save(message: DirectMessage): Promise<DirectMessage>;
	findMessagesBetweenUsers(
		userId1: string,
		userId2: string,
	): Promise<DirectMessage[]>;
}
