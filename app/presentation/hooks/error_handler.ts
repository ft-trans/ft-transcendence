import {
	ErrBadRequest,
	ErrForbidden,
	ErrInternalServer,
	ErrNotFound,
	type ErrorCode,
	ErrUnauthorized,
} from "@domain/error";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

type AppError = {
	code: ErrorCode;
	userMessage: string;
	systemMessage?: string;
	details?: Record<string, string>;
};

const isAppError = (error: unknown): error is AppError => {
	return (
		error instanceof ErrBadRequest ||
		error instanceof ErrUnauthorized ||
		error instanceof ErrForbidden ||
		error instanceof ErrNotFound ||
		error instanceof ErrInternalServer
	);
};

export const errorHandler = (
	error: FastifyError | Error,
	request: FastifyRequest,
	reply: FastifyReply,
) => {
	// AppErrorの場合、エラーコードに応じたステータスコードを返す
	if (isAppError(error)) {
		request.log.error(
			{
				error: {
					code: error.code,
					userMessage: error.userMessage,
					systemMessage: error.systemMessage,
					details: error.details,
				},
				url: request.url,
				method: request.method,
			},
			"Application error occurred",
		);

		return reply.status(error.code).send({
			error: {
				code: error.code,
				message: error.userMessage,
				details: error.details,
			},
		});
	}

	// FastifyError（バリデーションエラーなど）の場合
	if ("statusCode" in error && typeof error.statusCode === "number") {
		request.log.error(
			{
				error: {
					message: error.message,
					statusCode: error.statusCode,
				},
				url: request.url,
				method: request.method,
			},
			"Fastify error occurred",
		);

		return reply.status(error.statusCode).send({
			error: {
				code: error.statusCode,
				message: error.message,
			},
		});
	}

	// その他の予期しないエラーの場合は500を返す
	request.log.error(
		{
			error: {
				message: error.message,
				stack: error.stack,
			},
			url: request.url,
			method: request.method,
		},
		"Unexpected error occurred",
	);

	return reply.status(500).send({
		error: {
			code: 500,
			message: "サーバーエラーが発生しました",
		},
	});
};
