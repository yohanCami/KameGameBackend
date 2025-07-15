import type { Request, Response } from "express"

export const getAll = (req: Request, res: Response) => {
	res.send("all packs")
}

export const getOne = (req: Request, res: Response) => {
	res.send("one pack")
}

export const create = (req: Request, res: Response) => {
	res.send("create pack")
}

export const updateOne = (req: Request, res: Response) => {
	res.send("update pack")
}

export const deleteOne = (req: Request, res: Response) => {
	res.send("delete pack")
}
