import { eq } from "drizzle-orm";
import { db } from "../db";
import type {
	CartCard,
	CartPack,
	ItemAddParams,
	ManyItemsAdd,
	OneItemAdd,
} from "../schemas/cart";
import { cartProductsTable } from "../db/schema";

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
	// FIXME: if item already in cart, add one to quantity
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

	await db.insert(cartProductsTable).values(values);
};
