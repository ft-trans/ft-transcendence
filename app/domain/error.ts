export enum ErrorCode {
	// 4xx Client Error
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,

	// 5xx Server Error
	INTERNAL_SERVER_ERROR = 500,
}

const ErrorCodeMessages: Record<ErrorCode, string> = {
	[ErrorCode.BAD_REQUEST]: "入力に誤りがあります",
	[ErrorCode.UNAUTHORIZED]: "認証が必要です",
	[ErrorCode.FORBIDDEN]: "アクセスが禁止されています",
	[ErrorCode.NOT_FOUND]: "リソースが見つかりません",
	[ErrorCode.INTERNAL_SERVER_ERROR]: "サーバーエラーが発生しました",
};

class AppError extends Error {
	readonly code: ErrorCode;
	readonly userMessage: string;
	readonly systemMessage?: string;
	readonly details?: Record<string, string>;

	constructor({
		code,
		userMessage = ErrorCodeMessages[code],
		systemMessage,
		details,
	}: {
		code: ErrorCode;
		userMessage?: string;
		systemMessage?: string;
		details?: Record<string, string>;
	}) {
		super(userMessage);
		this.name = "AppError";
		this.code = code;
		this.userMessage = userMessage;
		this.systemMessage = systemMessage;
		this.details = details;
	}
}

export class BadRequestError extends AppError {
	constructor({
		userMessage,
		details,
	}: { userMessage?: string; details?: Record<string, string> }) {
		super({
			code: ErrorCode.BAD_REQUEST,
			userMessage: userMessage,
			details,
		});
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends AppError {
	constructor() {
		super({
			code: ErrorCode.UNAUTHORIZED,
		});
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor() {
		super({
			code: ErrorCode.FORBIDDEN,
		});
		this.name = "ForbiddenError";
	}
}

export class NotFoundError extends AppError {
	constructor() {
		super({
			code: ErrorCode.NOT_FOUND,
		});
		this.name = "NotFoundError";
	}
}

export class InternalServerError extends AppError {
	constructor({ systemMessage }: { systemMessage?: string } = {}) {
		super({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			systemMessage,
		});
		this.name = "InternalServerError";
	}
}
