import { z } from "zod/v4";
import { cardSelectSchema } from "./cards";
import { packSelectSchema } from "./packs";

const cartCardSchema = cardSelectSchema.extend({
	quantity: z.number().positive(),
});

export type CartCard = z.infer<typeof cartCardSchema>;

const cartPackSchema = packSelectSchema.extend({
	quantity: z.number().positive(),
});

export type CartPack = z.infer<typeof cartPackSchema>;

export const oneItemAddSchema = z
	.object({
		cardId: cardSelectSchema.shape.id.nullish(),
		packId: packSelectSchema.shape.id.nullish(),
		quantity: z.number().default(1),
	})
	.refine(
		(data) =>
			!!data.cardId || !!data.packId || (!!data.cardId && !!data.packId),
		"Exactly one of cardId or packId must be specified",
	);

export type OneItemAdd = z.infer<typeof oneItemAddSchema>;

export const manyItemsAddSchema = z.object({
	items: z.array(oneItemAddSchema),
});

export type ManyItemsAdd = z.infer<typeof manyItemsAddSchema>;

export const itemAddSchema = oneItemAddSchema.or(manyItemsAddSchema);

export type ItemAddParams = z.infer<typeof itemAddSchema>;
