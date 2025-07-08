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

	// FIXME: if `values` contains items (IDs) that don't exist in the database,
	// inform the user intead of throwing db exception here
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
	const changed = await db
		.update(cartProductsTable)
		.set({ quantity: item.quantity })
		.where(and(eq(cartProductsTable.userName, username), eq(col, val)))
		.returning({ id: cartProductsTable.id });
	return changed.length > 0;
};

export const deleteOne = async (username: string, item: ItemDeleteParams) => {
	let col: PgColumn;
	if (item.category === "card") {
		col = cartProductsTable.cardId;
	} else {
		col = cartProductsTable.packId;
	}
	const changed = await db
		.delete(cartProductsTable)
		.where(and(eq(cartProductsTable.userName, username), eq(col, item.id)))
		.returning({ id: cartProductsTable.id });
	return changed.length > 0;
};

export const clearCart = async (username: string) => {
	await db
		.delete(cartProductsTable)
		.where(eq(cartProductsTable.userName, username));
};
