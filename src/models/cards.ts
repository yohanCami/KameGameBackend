import { and, count, eq } from "drizzle-orm";
import { db } from "../db";
import { cardsTable } from "../db/schema";
import type { CardSearchSchema, CreateCard } from "../schemas/cards";
import { fullTextSearchSql, withPagination } from "./searchHelper";

export const search = async (params: CardSearchSchema) => {
	const itemName = params.itemName ? params.itemName.trim() : null;
	const query = db
		.select()
		.from(cardsTable)
		.where(
			and(
				itemName ? fullTextSearchSql(cardsTable.name, itemName) : undefined,
				params.cardAttribute
					? eq(cardsTable.attribute, params.cardAttribute)
					: undefined,
			),
		)
		.$dynamic();
	const cards = await withPagination(query, params.page, params.itemsPerPage);
	const cardsCount = await db.select({ count: count() }).from(cardsTable);
	const totalPages = Math.ceil(cardsCount[0].count / params.itemsPerPage);
	return [cards, totalPages];
};

export const one = async (cardId: number) => {
	return await db.select().from(cardsTable).where(eq(cardsTable.id, cardId));
};

export const createOne = async (params: CreateCard) => {
	await db.insert(cardsTable).values(params);
};
