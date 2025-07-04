import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { cardsTable } from "../db/schema";
import { searchSchema } from "./search";

export const cardSelectSchema = createSelectSchema(cardsTable);

export type CardSelectSchema = z.infer<typeof cardSelectSchema>;

export const cardSearchSchema = searchSchema.extend({
	cardAttribute: cardSelectSchema.shape.attribute.nullish(),
});

export type CardSearchSchema = z.infer<typeof cardSearchSchema>;
