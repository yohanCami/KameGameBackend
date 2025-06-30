import type { NextFunction, Request, Response } from "express";
import { errorResponse, HttpStatus } from "../utils";
import * as jose from "jose";
import { jwtSchema, JWTSchema } from "../schemas/user";

export interface AuthenticatedRequest extends Request {
	user?: JWTSchema;
}

export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const h = req.header("Authorization");
	if (!h) {
		errorResponse(
			res,
			HttpStatus.UNAUTHORIZED,
			"not authenticated, please login to access this resource",
		);
		return;
	}

	if (!h.startsWith("Bearer ")) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "invalid Authorization header");
		return;
	}

	const token = h.slice(7);
	const secret = new TextEncoder().encode(process.env.JWT_SECRET);
	let verifyResult;
	try {
		verifyResult = await jose.jwtVerify(token, secret);
	} catch (err) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "invalid token");
		return;
	}
	const user = jwtSchema.safeParse(verifyResult.payload);
	if (!user.success) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "invalid token");
		return;
	}
	(req as AuthenticatedRequest).user = user.data;
	next();
};
