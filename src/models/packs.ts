// models/packs.ts
import { db } from "../db"
import { packsTable } from "../db/schema"
import { eq } from "drizzle-orm"

export const getAllPacks = async () => {
	return db.select().from(packsTable)
}

export const getPackById = async (id: number) => {
	const result = await db
		.select()
		.from(packsTable)
		.where(eq(packsTable.id, id))

	return result[0] ?? null
}

export const createPack = async (data: {
	name: string
	price: number
	imageUrl: string
	rarity: typeof packsTable.$inferSelect.rarity
	discount?: number
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
		.returning()

	return result[0]
}

export const updatePackById = async (
	id: number,
	data: Partial<{
		name: string
		price: number
		imageUrl: string
		rarity: typeof packsTable.$inferSelect.rarity
		discount: number
	}>
) => {
	const result = await db
		.update(packsTable)
		.set(data)
		.where(eq(packsTable.id, id))
		.returning()

	return result[0] ?? null
}

export const deletePackById = async (id: number) => {
	await db.delete(packsTable).where(eq(packsTable.id, id))
}
