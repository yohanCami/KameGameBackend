import type { Request, Response } from "express";
import {
	getAllPacks,
	getPackById,
	createPack,
	updatePackById,
	deletePackById,
} from "../models/packs";

export const getAll = async (_req: Request, res: Response) => {
	const packs = await getAllPacks();
	res.json(packs);
};

export const getOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

	const pack = await getPackById(id);
	if (!pack) return res.status(404).json({ error: "Pack not found" });

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
	if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

	const updated = await updatePackById(id, req.body);
	if (!updated) return res.status(404).json({ error: "Pack not found" });

	res.json(updated);
};

export const deleteOne = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

	await deletePackById(id);
	res.status(204).send();
};
