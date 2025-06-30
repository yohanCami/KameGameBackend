import { type Response } from "express";

export const CREATED = 201;
export const BAD_REQUEST = 400;
export const INTERNAL_SERVER_ERROR = 500;

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
