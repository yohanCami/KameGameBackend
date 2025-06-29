import type { Request, Response } from "express";

export const getAll = (req: Request, res: Response) => {
	res.send("all cards");
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
