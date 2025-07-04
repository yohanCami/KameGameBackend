import type { Request, Response } from "express";
import { createOne, one, search } from "../models/cards";
import {
	cardSearchSchema,
	createCardSchema,
	getOneSchema,
} from "../schemas/cards";
import { errorResponse, HttpStatus, successResponse } from "../utils";

export const getAll = async (req: Request, res: Response) => {
	const params = cardSearchSchema.safeParse(req.query);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid search params",
			params.error.issues,
		);
		return;
	}

	const [cards, totalPages] = await search(params.data);
	successResponse(res, HttpStatus.OK, "", {
		results: cards,
		totalPages: totalPages,
	});
};

export const getOne = async (req: Request, res: Response) => {
	const params = getOneSchema.safeParse(req.params);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid params",
			params.error.issues,
		);
		return;
	}

	const card = await one(params.data.id);
	successResponse(res, HttpStatus.OK, "", card);
};

export const create = async (req: Request, res: Response) => {
	const params = createCardSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid card creation params",
			params.error.issues,
		);
		return;
	}

	try {
		await createOne(params.data);
	} catch (err) {
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to create card",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "card created");
};

export const updateOne = (req: Request, res: Response) => {
	res.send("update card");
};

export const deleteOne = (req: Request, res: Response) => {
	res.send("delete card");
};
