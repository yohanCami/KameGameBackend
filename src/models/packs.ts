// models/packs.ts
import { db } from "../db";
import { cardsTable, packCardsTable, packsTable } from "../db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import {
	type CreatePackSchema,
	packSearchSchema,
	type PackSearchSchema,
	PackSelectSchema,
	type UpdatePackSchema,
} from "../schemas/packs";
import { fullTextSearchSql, withPagination } from "./searchHelper";
import type { MaybeSuccess } from "../utils";
import { CardSelectSchema } from "../schemas/cards";

type PackInResponse = PackSelectSchema & { cards: CardSelectSchema[]};

export const search = async (params: PackSearchSchema) => {
	const safeParams = packSearchSchema.parse(params);

	const itemName = safeParams.itemName ? safeParams.itemName.trim() : null;
	const whereCondition = and(
		itemName ? fullTextSearchSql(packsTable.name, itemName) : undefined,
		safeParams.packRarity
			? eq(packsTable.rarity, safeParams.packRarity)
			: undefined,
	);

	const packsWithCards = await db.query.packCardsTable.findMany({
		with: {
			pack: true,
			card: true,
		},
		where: whereCondition,
		limit: safeParams.itemsPerPage,
		offset: (safeParams.page - 1) * safeParams.itemsPerPage
	})

	const packsCount = await db
		.select({ count: count() })
		.from(packsTable)
		.where(whereCondition);

	const totalPages = Math.ceil(
		packsCount[0].count / (safeParams.itemsPerPage || 20),
	);

	const packs: Record<number, PackInResponse> = {};
	for (const item of packsWithCards) {
		if (packs[item.packId] !== undefined) {
			packs[item.packId].cards.push(item.card)
			continue;
		}

		packs[item.packId] = {...item.pack, cards: [item.card]};
	}

	return [Object.values(packs), totalPages];
};

export const one = async (id: number) => {
	const packWithCards = await db.query.packCardsTable.findMany({
		with: {
			pack: true,
			card: true
		},
		where: eq(packCardsTable.packId, id)
	});

	if (packWithCards.length === 0) {
		return null
	}

	const pack: PackInResponse = {...packWithCards[0].pack, cards: []}
	pack.cards.push(...packWithCards.map(p => p.card))

	return pack ?? null;
};

export const createOne = async (params: CreatePackSchema) => {
	const result = await db
		.insert(packsTable)
		.values(params)
		.returning({ id: packsTable.id });
	return result[0].id;
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
