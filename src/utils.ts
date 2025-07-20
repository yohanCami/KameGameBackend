import type { Response } from "express";

type Success = [true, null];
type Err<E> = [false, E];

export type MaybeSuccess<E> = Success | Err<E>;

export enum HttpStatus {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	INTERNAL_SERVER_ERROR = 500,
}

export const successResponse = <T>(
	res: Response,
	status: number,
	message: string,
	data?: T,
) => {
	res.status(status);
	res.contentType("application/json");
	res.json({
		error: null,
		data: data ?? null,
		message,
		status,
	});
};

export const errorResponse = <T>(
	res: Response,
	status: number,
	message: string,
	error?: T,
) => {
	res.status(status);
	res.contentType("application/json");
	res.json({
		data: null,
		message,
		error: error ?? true,
		status,
	});
};
