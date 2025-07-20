import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { packsTable } from "../db/schema";
import { searchSchema } from "./search";
import { getOneSchema as getOneCardSchema } from "./cards";

export const packSelectSchema = createSelectSchema(packsTable);

export type PackSelectSchema = z.infer<typeof packSelectSchema>;

export const packSearchSchema = searchSchema.extend({
	packRarity: packSelectSchema.shape.rarity.nullish(),
});

export const getOneSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export const createPackSchema = createInsertSchema(packsTable);
export type CreatePackSchema = z.infer<typeof createPackSchema>;

export const updatePackSchema = createPackSchema
	.omit({ id: true })
	.partial()
	.refine(
		(obj) => Object.values(obj).some((v) => v !== undefined),
		"At least one value required",
	);
export type UpdatePackSchema = z.infer<typeof updatePackSchema>;

export type PackSearchSchema = z.infer<typeof packSearchSchema>;

export const addCardsSchema = z.object({
	cards: z.array(getOneCardSchema.shape.id),
});

export type AddCardsSchema = z.infer<typeof addCardsSchema>;

export const removeCardSchema = z.object({
	id: getOneCardSchema.shape.id,
	cardId: getOneCardSchema.shape.id,
});
