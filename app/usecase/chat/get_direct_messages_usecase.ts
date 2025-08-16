import type { DirectMessage } from "@domain/model/direct_message";
import { UserId } from "@domain/model/user";
import type { ITransaction } from "@usecase/transaction";

interface IGetDirectMessagesUsecase {
	userId: string;
	correspondentId: string;
}

export class GetDirectMessagesUsecase {
	constructor(private readonly transaction: ITransaction) {}

	async execute(input: IGetDirectMessagesUsecase): Promise<DirectMessage[]> {
		const userId = new UserId(input.userId);
		const correspondentId = new UserId(input.correspondentId);

		return this.transaction.exec(async (repo) => {
			const messageRepository = repo.newDirectMessageRepository();
			return messageRepository.findMessagesBetweenUsers(
				userId.value,
				correspondentId.value,
			);
		});
	}
}
