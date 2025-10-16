import { promises as fs } from "node:fs";
import { extname, join } from "node:path";
import { ErrBadRequest } from "@domain/error";
import { UserAvatar } from "@domain/model/user";
import type { MultipartFile } from "@fastify/multipart";
import { ulid } from "ulid";

export interface IAvatarUploadService {
	uploadAvatar(file: MultipartFile): Promise<UserAvatar>;
	deleteAvatar(avatarPath: string): Promise<void>;
}

export class AvatarUploadService implements IAvatarUploadService {
	private readonly uploadDir: string;
	private readonly maxFileSize: number;
	private readonly allowedMimeTypes: string[];

	constructor(
		uploadDir = "public/avatars",
		maxFileSize = 5 * 1024 * 1024, // 5MB
		allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
	) {
		this.uploadDir = uploadDir;
		this.maxFileSize = maxFileSize;
		this.allowedMimeTypes = allowedMimeTypes;
	}

	async uploadAvatar(file: MultipartFile): Promise<UserAvatar> {
		// ファイルタイプの検証
		if (!this.allowedMimeTypes.includes(file.mimetype)) {
			throw new ErrBadRequest({
				userMessage: "サポートされていないファイル形式です",
				details: {
					avatar: `使用可能な形式: ${this.allowedMimeTypes.join(", ")}`,
				},
			});
		}

		// ファイルサイズの検証
		const fileBuffer = await file.toBuffer();
		if (fileBuffer.length > this.maxFileSize) {
			throw new ErrBadRequest({
				userMessage: "ファイルサイズが大きすぎます",
				details: {
					avatar: `最大ファイルサイズ: ${this.maxFileSize / (1024 * 1024)}MB`,
				},
			});
		}

		// アップロードディレクトリの作成
		await this.ensureUploadDirectoryExists();

		// 一意のファイル名の生成
		const fileExtension = extname(file.filename || "");
		const filename = `${ulid()}${fileExtension}`;
		const filePath = join(this.uploadDir, filename);

		// ファイルの保存
		await fs.writeFile(filePath, fileBuffer);

		return UserAvatar.fromUploadedFile(filename);
	}

	async deleteAvatar(avatarPath: string): Promise<void> {
		if (!avatarPath.startsWith("/avatars/")) {
			return; // アップロードされたファイルではない場合はスキップ
		}

		const filename = avatarPath.replace("/avatars/", "");
		const filePath = join(this.uploadDir, filename);

		try {
			await fs.access(filePath);
			await fs.unlink(filePath);
		} catch (_error) {
			// ファイルが存在しない場合は無視
			console.warn(`Avatar file not found: ${filePath}`);
		}
	}

	private async ensureUploadDirectoryExists(): Promise<void> {
		try {
			await fs.access(this.uploadDir);
		} catch {
			await fs.mkdir(this.uploadDir, { recursive: true });
		}
	}
}
