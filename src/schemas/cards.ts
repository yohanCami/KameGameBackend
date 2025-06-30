import { createSelectSchema } from "drizzle-zod";
import { cardsTable } from "../db/schema";
import type { z } from "zod/v4";
import { searchSchema } from "./search";

const cardSelectSchema = createSelectSchema(cardsTable);

export type CardSelectSchema = z.infer<typeof cardSelectSchema>;

export const cardSearchSchema = searchSchema.extend({
	cardAttribute: cardSelectSchema.shape.attribute.nullish(),
});

export type CardSearchSchema = z.infer<typeof cardSearchSchema>;
