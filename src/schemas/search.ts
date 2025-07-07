import { z } from "zod/v4";

export const searchSchema = z.object({
	itemName: z.string().optional(),
	page: z.coerce.number().positive().default(1),
	itemsPerPage: z.coerce.number().positive().lte(50).default(20),
});
