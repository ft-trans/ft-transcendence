import { ErrNotFound } from "@domain/error";
import { type User, UserId } from "@domain/model";
import type { IAvatarUploadService } from "@domain/service/avatar_upload_service";
import type { MultipartFile } from "@fastify/multipart";
import type { ITransaction } from "@usecase/transaction";

export type UploadAvatarUsecaseInput = {
	id: string;
	file: MultipartFile;
};

export class UploadAvatarUsecase {
	constructor(
		private readonly tx: ITransaction,
		private readonly avatarUploadService: IAvatarUploadService,
	) {}

	async execute(input: UploadAvatarUsecaseInput): Promise<User> {
		return await this.tx.exec(async (repo) => {
			const userRepo = repo.newUserRepository();
			const userId = new UserId(input.id);

			// 現在のユーザー情報を取得
			const currentUser = await userRepo.findById(userId);
			if (!currentUser) {
				throw new ErrNotFound();
			}

			// 既存のアバターがアップロードされたファイルの場合、削除
			if (
				!currentUser.avatar.isDefaultAvatar &&
				currentUser.avatar.isUploadedFile
			) {
				await this.avatarUploadService.deleteAvatar(currentUser.avatar.value);
			}

			// 新しいアバターをアップロード
			const newAvatar = await this.avatarUploadService.uploadAvatar(input.file);

			// ユーザーのアバターを更新
			const updatedUser = currentUser.updateProfile(
				undefined,
				undefined,
				newAvatar,
			);

			return await userRepo.update(updatedUser);
		});
	}
}
