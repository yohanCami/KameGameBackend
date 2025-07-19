import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { inventoriesTable } from '../db/schema';
import { searchSchema } from './search';
import { cardSelectSchema } from './cards';

export const inventorySelectSchema = createSelectSchema(inventoriesTable);

export type InventorySelectSchema = z.infer<typeof inventorySelectSchema>;

export const inventorySearchSchema = searchSchema.extend({
    cardAttribute: cardSelectSchema.shape.attribute.optional(),
});

export type InventorySearchSchema = z.infer<typeof inventorySearchSchema>;
