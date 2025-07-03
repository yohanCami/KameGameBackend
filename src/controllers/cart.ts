import type { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/isAuthenticated";
import { addItemOrItems, getUserCart } from "../models/cart";
import { errorResponse, HttpStatus, successResponse } from "../utils";
import { itemAddSchema } from "../schemas/cart";

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
	const username = req.user!.name;
	try {
		const [cards, packs] = await getUserCart(username);
		successResponse(res, HttpStatus.OK, "", { cards, packs });
	} catch (err) {
		console.log("failed to get cart:", err);
		errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, "failed to get cart");
		return;
	}
};

export const addItem = async (req: AuthenticatedRequest, res: Response) => {
	const params = itemAddSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid item add params",
			params.error.issues,
		);
		return;
	}
	const username = req.user!.name;
	try {
		await addItemOrItems(username, params.data);
		successResponse(res, HttpStatus.OK, "item(s) added");
	} catch (err) {
		console.log("failed to add item(s):", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to add item(s)",
		);
		return;
	}
};

export const updateItemCount = (req: Request, res: Response) => {
	res.send("update item count in cart");
};

export const deleteItem = (req: Request, res: Response) => {
	res.send("delete item from cart");
};

export const clear = (req: Request, res: Response) => {
	res.send("clear cart");
};
