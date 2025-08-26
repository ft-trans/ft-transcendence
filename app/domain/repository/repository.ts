import type { IBallRepository } from "./pong_repository";
import type { IUserRepository } from "./user_repository";

export interface IRepository {
	newUserRepository(): IUserRepository;
}

export interface IKVSRepository {
	newBallRepository(): IBallRepository;
}
