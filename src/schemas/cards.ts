import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { cardsTable } from "../db/schema";
import { searchSchema } from "./search";

export const cardSelectSchema = createSelectSchema(cardsTable);

export type CardSelectSchema = z.infer<typeof cardSelectSchema>;

export const cardSearchSchema = searchSchema.extend({
	cardAttribute: cardSelectSchema.shape.attribute.optional(),
});

export type CardSearchSchema = z.infer<typeof cardSearchSchema>;

export const getOneSchema = z.object({
	id: z.coerce.number(),
});

export const createCardSchema = createInsertSchema(cardsTable);

export type CreateCard = z.infer<typeof createCardSchema>;

export const updateCardSchema = createCardSchema
	.omit({ id: true })
	.partial()
	.refine(
		(obj) => Object.values(obj).some((v) => v !== undefined),
		"At least one value required",
	);

export type UpdateCard = z.infer<typeof updateCardSchema>;
