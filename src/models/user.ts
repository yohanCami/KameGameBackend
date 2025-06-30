import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import {
	AdminSelectSchema,
	UserSelectSchema,
	type SignupSchema,
} from "../schemas/user";
import * as argon2 from "argon2";

export const create = async (user: SignupSchema) => {
	const passwordHash = await argon2.hash(user.password);
	const newUser: typeof usersTable.$inferInsert = {
		name: user.name,
		passwordHash,
	};

	await db.insert(usersTable).values(newUser);
};

export const exists = async (name: string): Promise<boolean> => {
	const user = await db
		.select({ name: usersTable.name })
		.from(usersTable)
		.where(eq(usersTable.name, name));
	return user.length > 0;
};

export const find = async (
	name: string,
): Promise<UserSelectSchema | AdminSelectSchema | null> => {
	const user = await db
		.select({
			name: usersTable.name,
			yugiPesos: usersTable.yugiPesos,
			isAdmin: usersTable.isAdmin,
		})
		.from(usersTable)
		.where(eq(usersTable.name, name));
	if (user.length < 1) return null;
	const u = {
		name: user[0].name,
		yugiPesos: user[0].yugiPesos,
	};
	if (user[0].isAdmin) {
		(u as AdminSelectSchema).isAdmin = true;
	}
	return u;
};
