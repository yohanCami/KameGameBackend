import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "../db/schema";

export const adminSelectSchema = createSelectSchema(usersTable).omit({
	passwordHash: true,
});

export const userSelectSchema = adminSelectSchema.omit({ isAdmin: true });

export type UserSelectSchema = z.infer<typeof userSelectSchema>;
export type AdminSelectSchema = z.infer<typeof adminSelectSchema>;

export const loginSchema = userSelectSchema.pick({ name: true }).extend({
	password: z.string().min(5).max(50),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const signupSchema = createInsertSchema(usersTable, {
	name: (schema) => schema.min(3).regex(/^[a-zA-Z0-9]+$/),
})
	.omit({ passwordHash: true, yugiPesos: true })
	.extend({
		password: z.string().min(5).max(50),
	});

export type SignupSchema = z.infer<typeof signupSchema>;

export const jwtSchema = adminSelectSchema
	.pick({ name: true, isAdmin: true })
	.extend({
		iat: z.number(),
	});

export type JWTSchema = z.infer<typeof jwtSchema>;
