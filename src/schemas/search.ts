import { z } from "zod/v4";

export const searchSchema = z.object({
	itemName: z.string().nullish(),
	page: z.number().positive().default(1),
	itemsPerPage: z.number().positive().lte(50).default(20),
});
