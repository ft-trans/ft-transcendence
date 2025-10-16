import { ErrBadRequest } from "@domain/error";
import type { AuthPrehandler } from "@presentation/hooks/auth_prehandler";
import {
	type UpdateProfileRequest,
	type UploadAvatarResponse,
	updateProfileFormSchema,
} from "@shared/api/profile";
import type { DeleteUserUsecase } from "@usecase/user/delete_user_usecase";
import type { UpdateUserUsecase } from "@usecase/user/update_user_usecase";
import type { UploadAvatarUsecase } from "@usecase/user/upload_avatar_usecase";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const profileController = (
	updateUserUsecase: UpdateUserUsecase,
	deleteUserUsecase: DeleteUserUsecase,
	uploadAvatarUsecase: UploadAvatarUsecase,
	authPrehandler: AuthPrehandler,
) => {
	return async (fastify: FastifyInstance) => {
		fastify.put(
			"/profile",
			{ preHandler: authPrehandler },
			onUpdateProfile(updateUserUsecase),
		);
		fastify.post(
			"/profile/avatar",
			{ preHandler: authPrehandler },
			onUploadAvatar(uploadAvatarUsecase),
		);
		fastify.delete(
			"/profile",
			{ preHandler: authPrehandler },
			onDeleteProfile(deleteUserUsecase),
		);
	};
};

const onUpdateProfile = (usecase: UpdateUserUsecase) => {
	return async (
		req: FastifyRequest<{ Body: UpdateProfileRequest }>,
		reply: FastifyReply,
	) => {
		const input = updateProfileFormSchema.safeParse({
			email: req.body.user.email,
			username: req.body.user.username,
			avatar: req.body.user.avatar,
		});
		if (!input.success) {
			const flattened = z.flattenError(input.error);
			throw new ErrBadRequest({
				userMessage: "入力に誤りがあります",
				details: {
					email: flattened.fieldErrors.email?.join(", "),
					username: flattened.fieldErrors.username?.join(", "),
					avatar: flattened.fieldErrors.avatar?.join(", "),
				},
			});
		}
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
		}

		const output = await usecase.execute({
			id: userId,
			email: input.data.email,
			username: input.data.username,
			avatar: input.data.avatar,
		});
		reply.send({
			user: {
				id: output.id.value,
				email: output.email.value,
				username: output.username.value,
				avatar: output.avatar.value,
				status: output.status.value,
			},
		});
	};
};

const onUploadAvatar = (usecase: UploadAvatarUsecase) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			const userId = req.authenticatedUser?.id;
			if (!userId) {
				throw new ErrBadRequest({
					userMessage: "認証が必要です",
				});
			}

			// マルチパートファイルを取得
			const data = await req.file();
			if (!data) {
				throw new ErrBadRequest({
					userMessage: "ファイルがアップロードされていません",
				});
			}

			const updatedUser = await usecase.execute({
				id: userId,
				file: data,
			});

			const response: UploadAvatarResponse = {
				user: {
					id: updatedUser.id.value,
					email: updatedUser.email.value,
					username: updatedUser.username.value,
					avatar: updatedUser.avatar.value,
					status: updatedUser.status.value,
				},
			};

			return reply.send(response);
		} catch (error) {
			if (error instanceof ErrBadRequest) {
				throw error;
			}
			throw new ErrBadRequest({
				userMessage: "アバターのアップロードに失敗しました",
			});
		}
	};
};

const onDeleteProfile = (usecase: DeleteUserUsecase) => {
	return async (req: FastifyRequest, reply: FastifyReply) => {
		const userId = req.authenticatedUser?.id;
		if (!userId) {
			throw new ErrBadRequest({
				userMessage: "認証が必要です",
			});
		}

		const output = await usecase.execute({ id: userId });
		reply.send({
			user: {
				id: output.id.value,
				email: output.email.value,
				username: output.username.value,
				avatar: output.avatar.value,
				status: output.status.value,
			},
		});
	};
};
