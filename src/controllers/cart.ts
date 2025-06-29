import type { Request, Response } from "express";

export const getCart = (req: Request, res: Response) => {
	res.send("cart");
};

export const addItem = (req: Request, res: Response) => {
	res.send("add item to cart");
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
