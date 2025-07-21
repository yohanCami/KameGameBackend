import { and, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn, AnyPgTable, PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
	cardsTable,
	cartProductsTable,
	inventoriesTable,
	packCardsTable,
	packsTable,
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
import type { MaybeSuccess } from "../utils";

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
): Promise<boolean> => {
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

	const itemsExistResult = await itemsExist(values);

	if (!itemsExistResult) {
		return false;
	}

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

	return true;
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
): Promise<MaybeSuccess<string>> => {
	return await db.transaction(async (tx) => {
		const cartItems = await tx.query.cartProductsTable.findMany({
			with: {
				card: true,
				pack: true,
			},
			where: eq(cartProductsTable.userName, username),
		});

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

		const cartCards = cartItems.filter((i) => i.cardId !== null);
		const cartPacks = cartItems.filter((i) => i.packId !== null);
		const cartPacksIDs = cartPacks.map((p) => p.packId as number);

		// check if cards in stock
		for (const cartItem of cartCards) {
			if (cartItem.card!.stock < cartItem.quantity) {
				return [false, "the cart includes cards that don't have enough stock"];
			}
		}

		// check if packs in stock
		for (const cartItem of cartPacks) {
			if (cartItem.pack!.stock < cartItem.quantity) {
				return [false, "the cart includes packs that don't have enough stock"];
			}
		}

		// lista de todas las cartas por comprar (las que estén explicitamente en el carrito junto
		// a las que estén asociadas a los paquetes de los carritos)
		const cardsToBuy: Record<
			number,
			{
				quantityToBuy: number;
				stock: number;
				price: number;
			}
		> = {};

		// add explicitly added cards
		for (const cartItem of cartCards) {
			cardsToBuy[cartItem.cardId as number] = {
				quantityToBuy: cartItem.quantity,
				stock: cartItem.card!.stock,
				price: cartItem.card!.price,
			};
		}

		// add cards from packs
		const cartCardsInPack = await tx.query.packCardsTable.findMany({
			with: { card: true },
			where: inArray(packCardsTable.packId, cartPacksIDs),
		});
		for (const card of cartCardsInPack) {
			const cartItemPack = cartPacks.find((p) => p.packId === card.packId)!;

			if (cardsToBuy[card.cardId] === undefined) {
				cardsToBuy[card.cardId] = {
					quantityToBuy: cartItemPack.quantity,
					stock: card.card.stock,
					price: card.card.price,
				};
				continue;
			}

			cardsToBuy[card.cardId].quantityToBuy += cartItemPack.quantity;
		}

		if (Object.entries(cardsToBuy).length === 0) {
			return [false, "the cart is empty, nothing to buy"];
		}

		// subtract quantity from cards stock
		await updateMany(
			tx,
			cardsTable,
			cartCards.map((item) => ({
				id: item.cardId as number,
				quantityToBuy: item.quantity,
			})),
		);

		// subtract quantity from packs stock
		if (cartPacks.length > 0) {
			await updateMany(
				tx,
				packsTable,
				cartPacks.map((item) => ({
					id: item.packId as number,
					quantityToBuy: item.quantity,
				})),
			);
		}

		// subtract total from user's balance
		if (cartCards.length > 0) {
			await tx
				.update(usersTable)
				.set({ yugiPesos: sql`${usersTable.yugiPesos} - ${totalPrice}` })
				.where(eq(usersTable.name, username));
		}

		// add cards to user's inventory
		const inventoryValues = [];
		for (const [cardId, card] of Object.entries(cardsToBuy)) {
			inventoryValues.push({
				userName: username,
				cardId: Number.parseInt(cardId),
				amount: card.quantityToBuy,
				value: card.price,
			});
		}
		await tx
			.insert(inventoriesTable)
			.values(inventoryValues)
			.onConflictDoUpdate({
				target: [inventoriesTable.userName, inventoriesTable.cardId],
				set: { amount: sql`${inventoriesTable.amount}+EXCLUDED.amount` },
			});

		// clear cart
		await clearCart(username);

		return [true, null];
	});
};

const updateMany = async (
	tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
	table: AnyPgTable & { id: AnyPgColumn; stock: AnyPgColumn },
	items: { id: number; quantityToBuy: number }[],
) => {
	const sqlChunks: SQL[] = [];
	const ids: number[] = [];

	sqlChunks.push(sql`(case`);

	for (const item of items) {
		sqlChunks.push(
			sql`when ${table.id} = ${item.id} then ${table.stock} - ${item.quantityToBuy}`,
		);
		ids.push(item.id);
	}

	sqlChunks.push(sql`end)`);

	const finalSql: SQL = sql.join(sqlChunks, sql.raw(" "));

	await tx.update(table).set({ stock: finalSql }).where(inArray(table.id, ids));
};

// retorna los items en `items` que no existen en la base de datos
const itemsExist = async (items: { cardId?: number; packId?: number }[]) => {
	const cardIds = [];
	const packIds = [];

	for (const item of items) {
		if (item.cardId !== undefined) {
			cardIds.push(item.cardId);
		}
		if (item.packId !== undefined) {
			packIds.push(item.packId);
		}
	}

	const cardsInDB = await db
		.select({ id: cardsTable.id })
		.from(cardsTable)
		.where(inArray(cardsTable.id, cardIds));
	const packsInDB = await db
		.select({ id: packsTable.id })
		.from(packsTable)
		.where(inArray(packsTable.id, packIds));

	const dbCards = cardsInDB.map((c) => c.id);
	const dbPacks = packsInDB.map((c) => c.id);

	return cardIds.length === dbCards.length && packIds.length === dbPacks.length;
};
