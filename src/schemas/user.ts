import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "../db/schema";

export const userSelectSchema = createSelectSchema(usersTable).omit({
	isAdmin: true,
	passwordHash: true,
});

export type UserSelect = z.infer<typeof userSelectSchema>;

export const signupSchema = createInsertSchema(usersTable, {
	name: (schema) => schema.min(3),
})
	.omit({ passwordHash: true, yugiPesos: true })
	.extend({
		password: z.string().min(5).max(50),
	});

export type SignupSchema = z.infer<typeof signupSchema>;
