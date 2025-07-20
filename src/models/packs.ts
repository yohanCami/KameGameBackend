// models/packs.ts
import { db } from "../db";
import { cardsTable, packCardsTable, packsTable } from "../db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import {
	CreatePackSchema,
	packSearchSchema,
	PackSearchSchema,
	UpdatePackSchema,
} from "../schemas/packs";
import { fullTextSearchSql, withPagination } from "./searchHelper";
import { MaybeSuccess } from "../utils";

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

export const getPackCards = async (packId: number) => {
	// verify the pack exists
	const dbPack = await db
		.select({ id: packsTable.id })
		.from(packsTable)
		.where(eq(packsTable.id, packId));
	if (dbPack.length === 0) {
		return false;
	}

	const cards = await db.query.packCardsTable.findMany({
		with: { card: true },
		where: eq(packCardsTable.packId, packId),
	});

	return cards.map((c) => c.card);
};

export const addCardsToPack = async (
	packId: number,
	cards: number[],
): Promise<MaybeSuccess<string>> => {
	// verify that the cards exist
	const dbCards = await db
		.select({ id: cardsTable.id })
		.from(cardsTable)
		.where(inArray(cardsTable.id, cards));

	if (dbCards.length !== cards.length) {
		return [false, "some cards don't exist in the database"];
	}

	const valuesToInsert = cards.map((cardId) => ({ packId, cardId }));

	await db.insert(packCardsTable).values(valuesToInsert).onConflictDoNothing();
	return [true, null];
};

export const removeCardFromPack = async (packId: number, cardId: number) => {
	// verify that the card exists in this pack
	const dbCard = await db
		.select({ cardId: packCardsTable.cardId })
		.from(packCardsTable)
		.where(
			and(eq(packCardsTable.packId, packId), eq(packCardsTable.cardId, cardId)),
		);

	if (dbCard.length === 0) {
		return false;
	}

	await db
		.delete(packCardsTable)
		.where(
			and(eq(packCardsTable.packId, packId), eq(packCardsTable.cardId, cardId)),
		);

	return true;
};
