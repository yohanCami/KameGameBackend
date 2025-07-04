import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod/v4";
import { packsTable } from "../db/schema";
import { searchSchema } from "./search";

export const packSelectSchema = createSelectSchema(packsTable);

export type PackSelectSchema = z.infer<typeof packSelectSchema>;

export const packSearchSchema = searchSchema.extend({
	packRarity: packSelectSchema.shape.rarity.nullish(),
});

export type PackSearchSchema = z.infer<typeof packSearchSchema>;
