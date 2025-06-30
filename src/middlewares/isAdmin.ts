import type { NextFunction, Response } from "express";
import { type AuthenticatedRequest, isAuthenticated } from "./isAuthenticated";
import { errorResponse, HttpStatus } from "../utils";

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
