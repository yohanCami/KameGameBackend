import { count, eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import type {
	AdminSelectSchema,
	UserSelectSchema,
	SignupSchema,
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
	const result = await db
		.select({ count: count() })
		.from(usersTable)
		.where(eq(usersTable.name, name));
	return result[0].count > 0;
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

export const findVerifyingPassword = async (name: string, password: string) => {
	const user = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.name, name));

	if (user.length < 1) return null;

	const verified = await argon2.verify(user[0].passwordHash, password);
	if (verified) {
		return user[0];
	} else {
		return null;
	}
};
