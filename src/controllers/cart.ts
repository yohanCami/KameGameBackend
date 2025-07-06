import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/isAuthenticated";
import {
	addItemOrItems,
	clearCart,
	deleteOne,
	getUserCart,
	updateCount,
} from "../models/cart";
import {
	itemAddSchema,
	itemCountUpdateSchema,
	itemDeleteSchema,
} from "../schemas/cart";
import { errorResponse, HttpStatus, successResponse } from "../utils";

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
	} catch (err) {
		console.log("failed to add item(s):", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to add item(s)",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "item(s) added");
};

export const updateItemCount = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	const params = itemCountUpdateSchema.safeParse(req.body);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid item update params",
			params.error.issues,
		);
		return;
	}
	const username = req.user!.name;
	try {
		await updateCount(username, params.data);
	} catch (err) {
		console.log("failed to update cart item:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to update item",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "item updated");
};

export const deleteItem = async (req: AuthenticatedRequest, res: Response) => {
	const params = itemDeleteSchema.safeParse(req.params);
	if (!params.success) {
		errorResponse(
			res,
			HttpStatus.BAD_REQUEST,
			"invalid item delete params",
			params.error.issues,
		);
		return;
	}
	const username = req.user!.name;
	try {
		await deleteOne(username, params.data);
	} catch (err) {
		console.log("failed to update cart item:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to delete item",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "item deleted");
};

export const clear = async (req: AuthenticatedRequest, res: Response) => {
	const username = req.user!.name;
	try {
		await clearCart(username);
	} catch (err) {
		console.log("failed to clear cart:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to clear cart",
		);
		return;
	}
	successResponse(res, HttpStatus.OK, "cart cleared");
};

export const buy = async (req: Request, res: Response) => {
	res.send("buy");
};
