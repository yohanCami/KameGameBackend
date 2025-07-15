import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
	cardsTable,
	cartProductsTable,
	packCardsTable,
	usersTable,
} from "../db/schema";
import type {
	CartCard,
	CartPack,
	ItemAddParams,
	ItemCountUpdateParams,
	ItemDeleteParams,
	ManyItemsAdd,
	OneItemAdd,
} from "../schemas/cart";
import * as UserModel from "./user";

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

export const buyItemsInCart = async (
	username: string,
): Promise<[boolean, string | null]> => {
	return await db.transaction(async (tx) => {
		const cartItems = await tx.query.cartProductsTable.findMany({
			with: {
				card: true,
				pack: true,
			},
			where: eq(cartProductsTable.userName, username),
		});

		if (cartItems.length === 0) {
			return [false, null];
		}

		// calculate total price of the cart
		let totalPrice = 0;
		for (const item of cartItems) {
			if (item.card !== null) {
				totalPrice += item.card.price * item.quantity;
			}
			if (item.pack !== null) {
				totalPrice += item.pack.price * item.quantity;
			}
		}

		// verify user has enough balance
		const user = await UserModel.find(username);
		if ((user?.yugiPesos || 0) < totalPrice) {
			return [
				false,
				`You don't have enough balance. Need at least ${totalPrice} YP`,
			];
		}

		// lista de todas las cartas por comprar (las que estén explicitamente en el carrito junto
		// a las que estén asociadas a los paquetes de los carritos)
		const cardsToBuy: { id: number; quantityToBuy: number; stock: number }[] =
			[];

		const cartCards = cartItems.filter((i) => i.cardId !== null);
		const cartPacks = cartItems.filter((i) => i.packId !== null);
		const cartPacksIDs = cartItems
			.filter((i) => i.packId !== null)
			.map((p) => p.packId as number);

		// add explicit added cards
		cardsToBuy.push(
			...cartCards.map((c) => ({
				id: c.cardId as number,
				quantityToBuy: c.quantity,
				stock: c.card!.stock,
			})),
		);

		// add cards from packs
		const cartCardsInPack = await tx.query.packCardsTable.findMany({
			with: { card: true },
			where: inArray(packCardsTable.packId, cartPacksIDs),
		});
		for (const card of cartCardsInPack) {
			const pack = cartPacks.find((p) => p.id === card.packId)!;
			cardsToBuy.push({
				id: card.cardId,
				quantityToBuy: pack.quantity,
				stock: card.card.stock,
			});
		}

		// check if in stock
		for (const card of cardsToBuy) {
			if (card.stock < card.quantityToBuy) {
				return [false, "the cart includes cards that don't have enough stock"];
			}
		}

		// subtract quantity from cards stock
		const updated = await updateMany(tx, cardsToBuy);

		if (updated) {
			// subtract total from user's balance
			await tx
				.update(usersTable)
				.set({ yugiPesos: sql`${usersTable.yugiPesos} - ${totalPrice}` })
				.where(eq(usersTable.name, username));

			// clear cart
			await clearCart(username);
		}

		return [updated, null];
	});
};

const updateMany = async (
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	items: { id: number; quantityToBuy: number }[],
) => {
	if (items.length === 0) {
		return false;
	}

	const sqlChunks: SQL[] = [];
	const ids: number[] = [];

	sqlChunks.push(sql`(case`);

	for (const item of items) {
		sqlChunks.push(
			sql`when ${cardsTable.id} = ${item.id} then ${cardsTable.stock} - ${item.quantityToBuy}`,
		);
		ids.push(item.id);
	}

	sqlChunks.push(sql`end)`);

	const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "));

	await tx
		.update(cardsTable)
		.set({ stock: finalSql })
		.where(inArray(cardsTable.id, ids));

	return true;
};
