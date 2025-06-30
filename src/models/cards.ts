import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { cardsTable } from "../db/schema";
import { CardSearchSchema } from "../schemas/cards";
import { fullTextSearchSql, withPagination } from "./searchHelper";

export const search = async (params: CardSearchSchema) => {
	const query = db
		.select()
		.from(cardsTable)
		.where(
			and(
				params.itemName
					? fullTextSearchSql(cardsTable.name, params.itemName)
					: undefined,
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
