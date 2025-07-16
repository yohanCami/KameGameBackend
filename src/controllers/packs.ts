import type { Request, Response } from "express";
import {
	one,
	deletePackById,
	update,
	createOne,
	search,
} from "../models/packs";
import {
	createPackSchema,
	updatePackSchema,
	getOneSchema,
	packSearchSchema,
} from "../schemas/packs";
import { errorResponse, HttpStatus, successResponse } from "../utils";

export const getAll = async (req: Request, res: Response) => {
	const parsed = packSearchSchema.safeParse(req.query);
	if (!parsed.success) {
		return errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid search params",
			parsed.error.issues,
		);
	}

	const [packs, totalPages] = await search(parsed.data);

	return successResponse(res, HttpStatus.OK, "", {
		results: packs,
		totalPages,
	});
};

export const getOne = async (req: Request, res: Response) => {
	const parsed = getOneSchema.safeParse(req.params);
	if (!parsed.success) {
		return errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid params",
			parsed.error.issues,
		);
	}

	const pack = await one(parsed.data.id);
	if (!pack) {
		return errorResponse(res, HttpStatus.NOT_FOUND, "Pack not found");
	}

	return successResponse(res, HttpStatus.OK, "", pack);
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
