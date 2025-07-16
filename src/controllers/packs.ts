import type { Request, Response } from "express";
import {
	one,
	createPack,
	updatePackById,
	deletePackById,
	search,
} from "../models/packs";
import { packSearchSchema, getOneSchema } from "../schemas/packs";
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
	try {
		const pack = await createPack(req.body);
		successResponse(res, HttpStatus.OK, "Pack created", pack);
	} catch (err) {
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"Failed to create pack",
		);
	}
};

export const updateOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid ID");
		return;
	}

	const updated = await updatePackById(id, req.body);
	if (!updated) {
		errorResponse(res, HttpStatus.NOT_FOUND, "Pack not found");
		return;
	}

	successResponse(res, HttpStatus.OK, "Pack updated", id);
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
