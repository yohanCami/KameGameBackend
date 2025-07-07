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
