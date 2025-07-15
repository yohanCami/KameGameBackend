import type { Request, Response } from "express";
import {
	getAllPacks,
	getPackById,
	createPack,
	updatePackById,
	deletePackById,
} from "../models/packs";
import { errorResponse, HttpStatus } from "../utils";

export const getAll = async (_req: Request, res: Response) => {
	const packs = await getAllPacks();
	res.json(packs);
};

export const getOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid ID");
		return;
	}

	const pack = await getPackById(id);
	if (!pack) {
		errorResponse(res, HttpStatus.NOT_FOUND, "Pack not found");
		return;
	}

	res.json(pack);
};

export const create = async (req: Request, res: Response) => {
	try {
		const pack = await createPack(req.body);
		res.status(201).json(pack);
	} catch (err) {
		res.status(400).json({ error: "Invalid data", details: err });
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

	res.json(updated);
};

export const deleteOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) {
		errorResponse(res, HttpStatus.BAD_REQUEST, "Invalid ID");
		return;
	}

	await deletePackById(id);
	res.status(204).send();
};
