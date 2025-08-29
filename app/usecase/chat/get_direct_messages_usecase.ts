import { ErrNotFound } from "@domain/error";
import type { DirectMessage } from "@domain/model/direct_message";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

type IGetDirectMessagesUsecase = {
	userId: string;
	correspondentId: string;
};

export class GetDirectMessagesUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IGetDirectMessagesUsecase): Promise<DirectMessage[]> {
		const userId = new UserId(input.userId);
		const correspondentId = new UserId(input.correspondentId);

		return this.transaction.exec(async (repo) => {
			const userRepository = repo.newUserRepository();
			const user = await userRepository.findById(userId);
			if (!user) {
				throw new ErrNotFound();
			}
			const correspondent = await userRepository.findById(correspondentId);
			if (!correspondent) {
				throw new ErrNotFound();
			}

			const messageRepository = repo.newDirectMessageRepository();
			return messageRepository.findMessagesBetweenUsers(
				userId.value,
				correspondentId.value,
			);
		});
	}
}
