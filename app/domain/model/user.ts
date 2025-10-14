import { isValid, ulid } from "ulid";
import { ErrBadRequest, ErrInternalServer } from "../error";
import { Password } from "./password";
import { ValueObject } from "./value_object";

export class UserId extends ValueObject<string, "UserId"> {
	protected validate(value: string): void {
		if (!isValid(value)) {
			throw new ErrBadRequest({
				details: {
					userId: "ユーザーIDは有効なULIDである必要があります",
				},
			});
		}
	}
}

export class UserEmail extends ValueObject<string, "UserEmail"> {
	// https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)
	static readonly PATTERN =
		/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

	validate(value: string) {
		if (!UserEmail.PATTERN.test(value)) {
			throw new ErrBadRequest({
				details: {
					userEmail: "メールアドレスの形式が正しくありません",
				},
			});
		}
	}
}

export class Username extends ValueObject<string, "Username"> {
	protected validate(value: string): void {
		if (value.length < 3 || value.length > 30) {
			throw new ErrBadRequest({
				details: {
					username: "ユーザー名は3文字以上30文字以下である必要があります",
				},
			});
		}
		// ユニークな表示名のため、英数字とアンダースコア、ハイフンのみ許可
		if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
			throw new ErrBadRequest({
				details: {
					username:
						"ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です",
				},
			});
		}
	}
}

export class UserAvatar extends ValueObject<string, "UserAvatar"> {
	static readonly DEFAULT_AVATAR = "";
	static readonly ALLOWED_EXTENSIONS = [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
	];
	static readonly MAX_PATH_LENGTH = 500;

	protected validate(value: string): void {
		// 空文字列の場合はデフォルトアバターを使用
		if (value === UserAvatar.DEFAULT_AVATAR) {
			return;
		}

		// パスの長さ検証
		if (value.length > UserAvatar.MAX_PATH_LENGTH) {
			throw new ErrBadRequest({
				details: {
					userAvatar: `アバターのパスは${UserAvatar.MAX_PATH_LENGTH}文字以下である必要があります`,
				},
			});
		}

		// ファイル拡張子の検証（アップロードされたファイルの場合）
		if (value.startsWith("/avatars/")) {
			const extension = value.substring(value.lastIndexOf(".")).toLowerCase();
			if (!UserAvatar.ALLOWED_EXTENSIONS.includes(extension)) {
				throw new ErrBadRequest({
					details: {
						userAvatar: `サポートされていないファイル形式です。使用可能な形式: ${UserAvatar.ALLOWED_EXTENSIONS.join(", ")}`,
					},
				});
			}
		}
	}

	static fromUploadedFile(filename: string): UserAvatar {
		return new UserAvatar(`/avatars/${filename}`);
	}

	get isDefaultAvatar(): boolean {
		return this.value === UserAvatar.DEFAULT_AVATAR;
	}

	get isUploadedFile(): boolean {
		return this.value.startsWith("/avatars/");
	}
}

export type UserStatus = "online" | "offline";

export class UserStatusValue extends ValueObject<UserStatus, "UserStatus"> {
	protected validate(value: UserStatus): void {
		if (value !== "online" && value !== "offline") {
			throw new ErrBadRequest({
				details: {
					userStatus:
						"ユーザーステータスはonlineまたはofflineである必要があります",
				},
			});
		}
	}
}

export class User {
	private constructor(
		readonly id: UserId,
		readonly email: UserEmail,
		readonly username: Username,
		readonly avatar: UserAvatar,
		readonly status: UserStatusValue,
		readonly passwordDigest: string | undefined,
	) {}

	static create(
		email: UserEmail,
		username: Username,
		avatar?: UserAvatar,
		passwordDigest?: string,
	): User {
		const id = new UserId(ulid());
		const defaultAvatar = avatar || new UserAvatar(UserAvatar.DEFAULT_AVATAR); // デフォルトアバター
		const defaultStatus = new UserStatusValue("offline");
		return new User(
			id,
			email,
			username,
			defaultAvatar,
			defaultStatus,
			passwordDigest,
		);
	}

	static reconstruct(
		id: UserId,
		email: UserEmail,
		username: Username,
		avatar: UserAvatar,
		status: UserStatusValue,
		passwordDigest?: string,
	): User {
		return new User(id, email, username, avatar, status, passwordDigest);
	}

	authenticated(plainPassword: string): boolean {
		if (!this.passwordDigest) {
			return false;
		}
		return Password.isCorrect({
			plainPassword,
			hashedPassword: this.passwordDigest,
		});
	}

	isModified(other: User): boolean {
		if (!this.id.equals(other.id)) {
			throw new ErrInternalServer();
		}
		return (
			!this.email.equals(other.email) ||
			!this.username.equals(other.username) ||
			!this.avatar.equals(other.avatar) ||
			!this.status.equals(other.status) ||
			this.passwordDigest !== other.passwordDigest
		);
	}

	// ユーザー情報更新用のメソッド
	updateProfile(
		email?: UserEmail,
		username?: Username,
		avatar?: UserAvatar,
	): User {
		return User.reconstruct(
			this.id,
			email || this.email,
			username || this.username,
			avatar || this.avatar,
			this.status,
			this.passwordDigest,
		);
	}

	// ステータス変更用のメソッド
	changeStatus(status: UserStatusValue): User {
		return User.reconstruct(
			this.id,
			this.email,
			this.username,
			this.avatar,
			status,
			this.passwordDigest,
		);
	}

	// オンライン状態確認用
	isOnline(): boolean {
		return this.status.value === "online";
	}
}
