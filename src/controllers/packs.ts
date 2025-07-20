import type { Request, Response } from "express";
import {
	one,
	deletePackById,
	update,
	createOne,
	search,
	addCardsToPack,
	getPackCards,
	removeCardFromPack,
} from "../models/packs";
import {
	createPackSchema,
	updatePackSchema,
	getOneSchema,
	packSearchSchema,
	addCardsSchema,
	removeCardSchema,
} from "../schemas/packs";
import {
	errorResponse,
	HttpStatus,
	MaybeSuccess,
	successResponse,
} from "../utils";
import { CardSelectSchema } from "../schemas/cards";

export const getAll = async (req: Request, res: Response) => {
	const parsed = packSearchSchema.safeParse(req.query);
	if (!parsed.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid search params",
			parsed.error.issues,
		);
		return;
	}

	const [packs, totalPages] = await search(parsed.data);

	successResponse(res, HttpStatus.OK, "", {
		results: packs,
		totalPages,
	});
};

export const getOne = async (req: Request, res: Response) => {
	const parsed = getOneSchema.safeParse(req.params);
	if (!parsed.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid params",
			parsed.error.issues,
		);
		return;
	}

	const pack = await one(parsed.data.id);
	if (!pack) {
		errorResponse(res, HttpStatus.NOT_FOUND, "Pack not found");
		return;
	}

	successResponse(res, HttpStatus.OK, "", pack);
};

export const create = async (req: Request, res: Response) => {
	const params = createPackSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid pack creation params",
			params.error.issues,
		);
		return;
	}

	try {
		await createOne(params.data);
		successResponse(res, HttpStatus.OK, "pack created");
	} catch (err) {
		console.error("failed to create pack", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to create pack",
		);
	}
};

export const updateOne = async (req: Request, res: Response) => {
	const idCheck = getOneSchema.safeParse(req.params);
	if (!idCheck.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid pack id param",
			idCheck.error.issues,
		);
		return;
	}

	const params = updatePackSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid pack update params",
			params.error.issues,
		);
		return;
	}

	let updated: boolean;
	try {
		updated = await update(idCheck.data.id, params.data);
	} catch (err) {
		console.error("failed to update pack", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to update pack",
		);
		return;
	}

	if (updated) {
		successResponse(res, HttpStatus.OK, "pack updated");
	} else {
		errorResponse(res, HttpStatus.NOT_FOUND, "pack not found");
	}
};

export const deleteOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid ID");
		return;
	}

	await deletePackById(id);
	successResponse(res, HttpStatus.OK, "Pack deleted", id);
};

export const getCards = async (req: Request, res: Response) => {
	const id = getOneSchema.safeParse(req.params);
	if (!id.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid get pack cards params",
			id.error.issues,
		);
		return;
	}

	let cards: CardSelectSchema[] | false;
	try {
		cards = await getPackCards(id.data.id);
	} catch (err) {
		console.log("error getting pack cards", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"internal server error",
		);
		return;
	}

	if (cards === false) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "pack not found");
		return;
	}

	successResponse(res, HttpStatus.OK, "", cards);
};

export const addCards = async (req: Request, res: Response) => {
	const id = getOneSchema.safeParse(req.params);
	const params = addCardsSchema.safeParse(req.body);
	if (!params.success || !id.success) {
		const issues = params.error?.issues ?? id.error?.issues;
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid add cards to pack params",
			issues,
		);
		return;
	}

	let result: MaybeSuccess<string>;
	try {
		result = await addCardsToPack(id.data.id, params.data.cards);
	} catch (err) {
		console.log("error adding cards to pack", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"internal server error",
		);
		return;
	}

	if (result[0]) {
		successResponse(res, HttpStatus.OK, "cards added");
		return;
	}

	errorResponse(res, HttpStatus.BAD_REQUEST, result[1]);
};

export const removeCard = async (req: Request, res: Response) => {
	const params = removeCardSchema.safeParse(req.params);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid remove cards from pack params",
			params.error.issues,
		);
		return;
	}

	let result: boolean;
	try {
		result = await removeCardFromPack(params.data.id, params.data.cardId);
	} catch (err) {
		console.log("error removing card from pack", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"internal server error",
		);
		return;
	}

	if (result) {
		successResponse(res, HttpStatus.OK, "card deleted");
		return;
	}

	errorResponse(res, HttpStatus.BAD_REQUEST, "card not found in this pack");
};
