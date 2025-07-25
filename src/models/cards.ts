import { and, count, eq, sql, gt } from "drizzle-orm";
import { db } from "../db";
import { cardsTable } from "../db/schema";
import type {
	CardSearchSchema,
	CreateCard,
	UpdateCard,
} from "../schemas/cards";
import { fullTextSearchSql, withPagination } from "./searchHelper";

export const search = async (params: CardSearchSchema) => {
	const itemName = params.itemName ? params.itemName.trim() : null;
	const whereCondition = and(
		itemName ? fullTextSearchSql(cardsTable.name, itemName) : undefined,
		params.cardAttribute
			? eq(cardsTable.attribute, params.cardAttribute)
			: undefined,
	);
	const query = db.select().from(cardsTable).where(whereCondition).$dynamic();
	const cards = await withPagination(query, params.page, params.itemsPerPage);
	const cardsCount = await db
		.select({ count: count() })
		.from(cardsTable)
		.where(whereCondition);
	const totalPages = Math.ceil(cardsCount[0].count / params.itemsPerPage);
	return [cards, totalPages];
};

export const one = async (cardId: number) => {
	const card = await db
		.select()
		.from(cardsTable)
		.where(eq(cardsTable.id, cardId));
	return card.length > 0 ? card[0] : null;
};

export const createOne = async (params: CreateCard) => {
	await db.insert(cardsTable).values(params);
};

export const update = async (cardId: number, params: UpdateCard) => {
	const changed = await db
		.update(cardsTable)
		.set(params)
		.where(eq(cardsTable.id, cardId))
		.returning({ id: cardsTable.id });
	return changed.length > 0;
};

// get randoms cards for ai's deck on battle
export const randomCards = async (num: number) => {
	const cards = await db
	.select()
	.from(cardsTable)
	.where(gt(cardsTable.stock, 0))
	.orderBy(sql`RANDOM()`)
	.limit(num);

	return cards;
};
