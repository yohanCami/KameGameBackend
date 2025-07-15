import type { Request, Response } from "express";
import { createOne, one, search, update } from "../models/cards";
import {
	cardSearchSchema,
	createCardSchema,
	getOneSchema,
	updateCardSchema,
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
		console.log("failed to create card", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to create card",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "card created");
};

export const updateOne = async (req: Request, res: Response) => {
	const cardId = getOneSchema.safeParse(req.params);
	if (!cardId.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid card id param",
			cardId.error.issues,
		);
		return;
	}

	const params = updateCardSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid card update params",
			params.error.issues,
		);
		return;
	}

	let updated: boolean;
	try {
		updated = await update(cardId.data.id, params.data);
	} catch (err) {
		console.log("failed to update card", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to update card",
		);
		return;
	}

	if (updated) {
		successResponse(res, HttpStatus.OK, "card updated");
	} else {
		errorResponse(res, HttpStatus.NOT_FOUND, "card not found");
	}
};

export const deleteOne = (req: Request, res: Response) => {
	res.send("delete card");
};
