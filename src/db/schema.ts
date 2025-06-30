import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	name: varchar({ length: 30 }).notNull().primaryKey(),
	passwordHash: varchar({ length: 100 }).notNull(),
	isAdmin: boolean().notNull().default(false),
	yugiPesos: integer().notNull().default(0),
});

export const cardsAttributeEnum = pgEnum("attribute", [
	"DARK",
	"DIVINE",
	"EARTH",
	"FIRE",
	"LIGHT",
	"WATER",
	"WIND",
]);

export const cardsTable = pgTable(
	"cards",
	{
		id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
		name: varchar({ length: 60 }).notNull(),
		price: integer().notNull(),
		imageUrl: varchar({ length: 255 }).notNull(),
		attribute: cardsAttributeEnum().notNull(),
		stock: integer().notNull().default(0),
		attack: integer().notNull(),
	},
	(table) => [
		index("card_name_search_index").using(
			"gin",
			sql`to_tsvector('english', ${table.name})`,
		),
	],
);

export const packsRarityEnum = pgEnum("rarity", [
	"COMMON",
	"RARE",
	"SUPER RARE",
	"ULTRA RARE",
]);

export const packsTable = pgTable("packs", {
	id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
	name: varchar({ length: 60 }).notNull(),
	price: integer().notNull(),
	imageUrl: varchar({ length: 255 }).notNull(),
	rarity: packsRarityEnum().notNull(),
});

export const inventoriesTable = pgTable(
	"inventories",
	{
		userName: varchar({ length: 30 })
			.references(() => usersTable.name)
			.notNull(),
		cardId: integer()
			.references(() => cardsTable.id)
			.notNull(),
		creationDate: timestamp().notNull().defaultNow(),
		value: integer().notNull(),
	},
	(table) => [primaryKey({ columns: [table.userName, table.cardId] })],
);

export const packCardsTable = pgTable(
	"pack_cards",
	{
		cardId: integer()
			.references(() => cardsTable.id)
			.notNull(),
		packId: integer()
			.references(() => cardsTable.id)
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.cardId, table.packId] })],
);
