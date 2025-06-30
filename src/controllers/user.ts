import type { Request, Response } from "express";
import { create, exists } from "../models/user";
import { signupSchema } from "../schemas/user";
import {
	BAD_REQUEST,
	CREATED,
	errorResponse,
	INTERNAL_SERVER_ERROR,
	successResponse,
} from "../utils";

export const signup = async (req: Request, res: Response) => {
	const user = signupSchema.safeParse(req.body);
	if (!user.success) {
		errorResponse(res, BAD_REQUEST, `error parsing user`, user.error.issues);
		return;
	}

	try {
		const alreadySignedUp = await exists(user.data.name);
		if (alreadySignedUp) {
			errorResponse(res, BAD_REQUEST, "user already exists");
			return;
		}
	} catch (err) {
		console.log("error checking if user exists", err);
		errorResponse(res, INTERNAL_SERVER_ERROR, "internal server error");
		return;
	}

	try {
		await create(user.data);
	} catch (err) {
		console.log("error creating user", err);
		errorResponse(res, INTERNAL_SERVER_ERROR, "failed to create user");
		return;
	}
	successResponse(res, CREATED, "sign up successfull");
};

export const login = (req: Request, res: Response) => {
	res.send("login");
};

export const me = (req: Request, res: Response) => {
	res.send("me");
};
