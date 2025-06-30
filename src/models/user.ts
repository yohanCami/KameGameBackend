import { eq } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import { UserSelect, type SignupSchema } from "../schemas/user";
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

export const find = async (name: string): Promise<UserSelect | null> => {
	const user = await db
		.select({ name: usersTable.name, yugiPesos: usersTable.yugiPesos })
		.from(usersTable)
		.where(eq(usersTable.name, name));
	return user.length > 0 ? user[0] : null;
};
