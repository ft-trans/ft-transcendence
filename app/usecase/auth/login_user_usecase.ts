import { ErrBadRequest, ErrInternalServer } from "@domain/error";
import { Session, SessionToken, UserEmail } from "@domain/model";
import type { ITransaction } from "@usecase/transaction";

export type LoginUserUsecaseInput = {
	email: string;
	password: string;
};

export type LoginUserUsecaseOutput = {
	session: Session;
	sessionToken: string;
};

export class LoginUserUsecase {
	constructor(private readonly tx: ITransaction) {}

	async execute(input: LoginUserUsecaseInput): Promise<LoginUserUsecaseOutput> {
		const email = new UserEmail(input.email);

		const result = await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const sessionRepo = repo.newSessionRepository();

			const user = await userRepo.findByEmail(email);
			if (!user) {
				throw new ErrBadRequest({
					userMessage: "メールアドレスまたはパスワードが正しくありません",
				});
			}

			if (!user.authenticated(input.password)) {
				throw new ErrBadRequest({
					userMessage: "メールアドレスまたはパスワードが正しくありません",
				});
			}

			const sessionToken = SessionToken.generate();
			const session = Session.create(user.id, sessionToken);

			const createdSession = await sessionRepo.create(session);
			if (!createdSession) {
				throw new ErrInternalServer();
			}

			return {
				session: createdSession,
				sessionToken: sessionToken.value,
			};
		});

		return result;
	}
}
