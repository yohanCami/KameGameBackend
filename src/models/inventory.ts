import { and, count, eq } from "drizzle-orm";
import { db } from "../db";
import { inventoriesTable, cardsTable } from "../db/schema";
import {
	inventorySearchSchema,
	InventorySearchSchema,
} from "../schemas/inventory";
import { fullTextSearchSql, withPagination } from "./searchHelper";

export const search = async (
	userName: string,
	params: InventorySearchSchema,
) => {
	const safeParams = inventorySearchSchema.parse(params);

	const itemName = safeParams.itemName ? safeParams.itemName.trim() : null;
	const whereCondition = and(
		eq(inventoriesTable.userName, userName),
		itemName ? fullTextSearchSql(cardsTable.name, itemName) : undefined,
		params.cardAttribute
			? eq(cardsTable.attribute, params.cardAttribute)
			: undefined,
	);

	const query = db
		.select({
			id: cardsTable.id,
			name: cardsTable.name,
			imageUrl: cardsTable.imageUrl,
			attribute: cardsTable.attribute,
			attack: cardsTable.attack,
			amount: inventoriesTable.amount,
		})
		.from(inventoriesTable)
		.innerJoin(cardsTable, eq(inventoriesTable.cardId, cardsTable.id))
		.where(whereCondition)
		.$dynamic();

	const inventory = await withPagination(
		query,
		params.page,
		params.itemsPerPage,
	);
	const inventoryCount = await db
		.select({ count: count() })
		.from(inventoriesTable)
		.innerJoin(cardsTable, eq(inventoriesTable.cardId, cardsTable.id))
		.where(whereCondition);
	const totalPages = Math.ceil(inventoryCount[0].count / params.itemsPerPage);
	return [inventory, totalPages];
};
