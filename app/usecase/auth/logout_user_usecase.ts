import { SessionToken } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type LogoutUserUsecaseInput = {
	sessionToken: string;
};

export class LogoutUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: LogoutUserUsecaseInput): Promise<void> {
		const sessionToken = new SessionToken(input.sessionToken);

		await this.tx.exec(async (repo) => {
			const sessionRepo = repo.newSessionRepository();
			await sessionRepo.deleteByToken(sessionToken);
		});
	}
}
