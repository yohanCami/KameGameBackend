import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/isAuthenticated";
import {
	addItemOrItems,
	buyItemsInCart,
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

	let updated: boolean;
	try {
		updated = await updateCount(username, params.data);
	} catch (err) {
		console.log("failed to update cart item:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to update item",
		);
		return;
	}

	if (updated) {
		successResponse(res, HttpStatus.OK, "item updated");
	} else {
		errorResponse(res, HttpStatus.NOT_FOUND, "item not found in the cart");
	}
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
	let updated: boolean;
	try {
		updated = await deleteOne(username, params.data);
	} catch (err) {
		console.log("failed to update cart item:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to delete item",
		);
		return;
	}

	if (updated) {
		successResponse(res, HttpStatus.OK, "item deleted");
	} else {
		errorResponse(res, HttpStatus.NOT_FOUND, "item not found in cart");
	}
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

export const buy = async (req: AuthenticatedRequest, res: Response) => {
	const username = req.user!.name;
	let bought: [boolean, string | null];
	try {
		bought = await buyItemsInCart(username);
	} catch (err) {
		console.log("failed to process purchase:", err);
		errorResponse(
			res,
			HttpStatus.INTERNAL_SERVER_ERROR,
			"failed to process purchase",
		);
		return;
	}

	if (bought[0]) {
		successResponse(res, HttpStatus.OK, "purchase completed");
	} else {
		if (bought[1] === null) {
			errorResponse(
				res,
				HttpStatus.BAD_REQUEST,
				"the cart is empty, nothing to buy",
			);
		} else {
			errorResponse(res, HttpStatus.BAD_REQUEST, bought[1]);
		}
	}
};
