import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { packsTable } from "../db/schema";
import { searchSchema } from "./search";

export const packSelectSchema = createSelectSchema(packsTable);

export type PackSelectSchema = z.infer<typeof packSelectSchema>;

export const packSearchSchema = searchSchema.extend({
	packRarity: packSelectSchema.shape.rarity.nullish(),
});

export const getOneSchema = z.object({
	id: z.coerce.number().int().positive(),
});

export type PackSearchSchema = z.infer<typeof packSearchSchema>;
