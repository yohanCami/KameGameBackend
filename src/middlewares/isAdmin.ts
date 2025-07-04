import type { NextFunction, Response } from "express";
import { errorResponse, HttpStatus } from "../utils";
import { type AuthenticatedRequest, isAuthenticated } from "./isAuthenticated";

export const isAdmin = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
) => {
	isAuthenticated(req, res, () => {
		if (req.user!.isAdmin) {
			next();
		} else {
			errorResponse(res, HttpStatus.FORBIDDEN, "unauthorized");
			return;
		}
	});
};
