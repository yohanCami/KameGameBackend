import { and, eq, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db";
import { cartProductsTable } from "../db/schema";
import type {
	CartCard,
	CartPack,
	ItemAddParams,
	ItemCountUpdateParams,
	ItemDeleteParams,
	ManyItemsAdd,
	OneItemAdd,
} from "../schemas/cart";

export const getUserCart = async (username: string) => {
	const products = await db.query.cartProductsTable.findMany({
		with: {
			card: true,
			pack: true,
		},
		where: eq(cartProductsTable.userName, username),
	});

	const cards = [];
	const packs = [];

	for (const product of products) {
		if (product.card !== null) {
			(product.card as CartCard).quantity = product.quantity;
			cards.push(product.card as CartCard);
		} else {
			(product.pack as CartPack).quantity = product.quantity;
			packs.push(product.pack as CartPack);
		}
	}

	return [cards, packs];
};

export const addItemOrItems = async (
	username: string,
	itemOrItems: ItemAddParams,
) => {
	let items = (itemOrItems as ManyItemsAdd).items;
	if (items === undefined) {
		items = [itemOrItems as OneItemAdd];
	}

	const values = items.map((item) => ({
		userName: username,
		cardId: item.cardId,
		packId: item.packId,
		quantity: item.quantity,
	}));

	await db
		.insert(cartProductsTable)
		.values(values)
		.onConflictDoUpdate({
			target: [
				cartProductsTable.userName,
				cartProductsTable.cardId,
				cartProductsTable.packId,
			],
			set: { quantity: sql`${cartProductsTable.quantity}+EXCLUDED.quantity` },
		});
};

export const updateCount = async (
	username: string,
	item: ItemCountUpdateParams,
) => {
	let col: PgColumn;
	let val: number;
	if (item.cardId !== undefined) {
		col = cartProductsTable.cardId;
		val = item.cardId;
	} else {
		col = cartProductsTable.packId;
		val = item.packId as number;
	}
	await db
		.update(cartProductsTable)
		.set({ quantity: item.quantity })
		.where(and(eq(cartProductsTable.userName, username), eq(col, val)));
};

// FIXME both in updateCount and deleteOne, if the id doesn't exist in the cart table, it doesn't
// show an error. It doesn't do anything either. Consider telling the user that the item isn't in
// the cart
export const deleteOne = async (username: string, item: ItemDeleteParams) => {
	let col: PgColumn;
	if (item.category === "card") {
		col = cartProductsTable.cardId;
	} else {
		col = cartProductsTable.packId;
	}
	await db
		.delete(cartProductsTable)
		.where(and(eq(cartProductsTable.userName, username), eq(col, item.id)));
};

export const clearCart = async (username: string) => {
	await db
		.delete(cartProductsTable)
		.where(eq(cartProductsTable.userName, username));
};
