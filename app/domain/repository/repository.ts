import type { IUserRepository } from "./user_repository";

export interface IRepository {
	newUserRepository(): IUserRepository;
}
