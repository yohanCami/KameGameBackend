// models/packs.ts
import { db } from "../db";
import { packsTable } from "../db/schema";
import { and, count, eq } from "drizzle-orm";
import {
	CreatePackSchema,
	packSearchSchema,
	PackSearchSchema,
	UpdatePackSchema,
} from "../schemas/packs";
import { fullTextSearchSql, withPagination } from "./searchHelper";

export const search = async (params: PackSearchSchema) => {
	const safeParams = packSearchSchema.parse(params);

	const itemName = safeParams.itemName ? safeParams.itemName.trim() : null;
	const whereCondition = and(
		itemName ? fullTextSearchSql(packsTable.name, itemName) : undefined,
		safeParams.packRarity
			? eq(packsTable.rarity, safeParams.packRarity)
			: undefined,
	);

	const query = db.select().from(packsTable).where(whereCondition).$dynamic();
	const packs = await withPagination(
		query,
		safeParams.page,
		safeParams.itemsPerPage,
	);

	const packsCount = await db
		.select({ count: count() })
		.from(packsTable)
		.where(whereCondition);

	const totalPages = Math.ceil(
		packsCount[0].count / (safeParams.itemsPerPage || 20),
	);

	return [packs, totalPages];
};

export const one = async (id: number) => {
	const result = await db
		.select()
		.from(packsTable)
		.where(eq(packsTable.id, id));

	return result[0] ?? null;
};

export const createOne = async (params: CreatePackSchema) => {
	await db.insert(packsTable).values(params);
};

export const update = async (packId: number, params: UpdatePackSchema) => {
	const changed = await db
		.update(packsTable)
		.set(params)
		.where(eq(packsTable.id, packId))
		.returning({ id: packsTable.id });

	return changed.length > 0;
};

export const deletePackById = async (id: number) => {
	await db.delete(packsTable).where(eq(packsTable.id, id));
};
