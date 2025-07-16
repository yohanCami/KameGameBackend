import * as argon2 from "argon2";
import { count, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { usersTable } from "../db/schema";
import type { AdminSelect, SignupParams, UserSelect, AddFundsParams } from "../schemas/user";

export const create = async (user: SignupParams) => {
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
): Promise<UserSelect | AdminSelect | null> => {
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
		(u as AdminSelect).isAdmin = true;
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
	}
	return null;
};

export const addFunds = async (name: string, amount: number): Promise<UserSelect | null> => {
	const userExists = await exists(name);
	if (!userExists) {
		return null;
	}

	const updated = await db
	.update(usersTable)
	.set({yugiPesos: sql`${usersTable.yugiPesos} + ${amount}`})
	.where(eq(usersTable.name, name))
	.returning({
		name: usersTable.name,
		yugiPesos: usersTable.yugiPesos,
		isAdmin: usersTable.isAdmin
	});

	if (updated.length === 0) return null;
	const user = updated[0];
	
	const result = {
		name: user.name,
		yugiPesos: user.yugiPesos
	}

	if (user.isAdmin) {
		(result as AdminSelect).isAdmin = true;
	}

	return result;
};
