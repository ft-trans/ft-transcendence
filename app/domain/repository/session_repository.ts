import type { Session, SessionToken } from "@domain/model";

export interface ISessionRepository {
	create(session: Session): Promise<Session>;
	findByToken(token: SessionToken): Promise<Session | undefined>;
	deleteByToken(token: SessionToken): Promise<void>;
}
