import type { Request, Response } from "express";
import { create, exists, find, findVerifyingPassword } from "../models/user";
import { loginSchema, signupSchema } from "../schemas/user";
import { errorResponse, HttpStatus, successResponse } from "../utils";
import * as jose from "jose";
import type { AuthenticatedRequest } from "../middlewares/isAuthenticated";

export const signup = async (req: Request, res: Response) => {
	const user = signupSchema.safeParse(req.body);
	if (!user.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"error parsing signup details",
			user.error.issues,
		);
		return;
	}

	try {
		const alreadySignedUp = await exists(user.data.name);
		if (alreadySignedUp) {
			errorResponse(res, HttpStatus.BAD_REQUEST, "user already exists");
			return;
		}
	} catch (err) {
		console.log("error checking if user exists", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"internal server error",
		);
		return;
	}

	try {
		await create(user.data);
	} catch (err) {
		console.log("error creating user", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to create user",
		);
		return;
	}
	successResponse(res, HttpStatus.CREATED, "sign up successfull");
};

export const login = async (req: Request, res: Response) => {
	const reqUser = loginSchema.safeParse(req.body);
	if (!reqUser.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"error parsing login details",
			reqUser.error.issues,
		);
		return;
	}

	const user = await findVerifyingPassword(
		reqUser.data.name,
		reqUser.data.password,
	);
	if (!user) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"incorrect username or password",
		);
		return;
	}

	const secret = new TextEncoder().encode(process.env.JWT_SECRET);
	const signedJWT = await new jose.SignJWT({
		name: user.name,
		isAdmin: user.isAdmin,
	})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.sign(secret);
	successResponse(res, HttpStatus.OK, "login successfull", {
		accessToken: signedJWT,
	});
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
	const user = await find(req.user!.name);
	if (!user) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "user not found");
		return;
	}

	successResponse(res, HttpStatus.OK, "", user);
};
