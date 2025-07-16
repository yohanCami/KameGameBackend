// models/packs.ts
import { db } from "../db";
import { packsTable } from "../db/schema";
import { and, count, eq } from "drizzle-orm";
import { packSearchSchema, PackSearchSchema } from "../schemas/packs";
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

export const createPack = async (data: {
	name: string;
	price: number;
	imageUrl: string;
	rarity: typeof packsTable.$inferSelect.rarity;
	discount?: number;
}) => {
	const result = await db
		.insert(packsTable)
		.values({
			name: data.name,
			price: data.price,
			imageUrl: data.imageUrl,
			rarity: data.rarity,
			discount: data.discount ?? 0,
		})
		.returning();

	return result[0];
};

export const updatePackById = async (
	id: number,
	data: Partial<{
		name: string;
		price: number;
		imageUrl: string;
		rarity: typeof packsTable.$inferSelect.rarity;
		discount: number;
	}>,
) => {
	const result = await db
		.update(packsTable)
		.set(data)
		.where(eq(packsTable.id, id))
		.returning();

	return result[0] ?? null;
};

export const deletePackById = async (id: number) => {
	await db.delete(packsTable).where(eq(packsTable.id, id));
};
