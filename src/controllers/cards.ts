import type { Request, Response } from "express";
import { search } from "../models/cards";
import { cardSearchSchema } from "../schemas/cards";
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

export const getOne = (req: Request, res: Response) => {
	res.send("one card");
};

export const create = (req: Request, res: Response) => {
	res.send("create card");
};

export const updateOne = (req: Request, res: Response) => {
	res.send("update card");
};

export const deleteOne = (req: Request, res: Response) => {
	res.send("delete card");
};
