import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	unique,
	varchar,
	real,
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

export const packsTable = pgTable(
	"packs",
	{
		id: integer().notNull().primaryKey().generatedByDefaultAsIdentity(),
		name: varchar({ length: 60 }).notNull(),
		price: integer().notNull(),
		imageUrl: varchar({ length: 255 }).notNull(),
		rarity: packsRarityEnum().notNull(),
		discount: real().default(0),
	},

	(table) => [
		index("pack_name_search_index").using(
			"gin",
			sql`to_tsvector('english', ${table.name})`,
		),
	],
);

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
		amount: integer().notNull().default(1),
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
			.references(() => packsTable.id)
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.cardId, table.packId] })],
);

export const packCardsRelations = relations(packCardsTable, ({ one }) => ({
	card: one(cardsTable, {
		fields: [packCardsTable.cardId],
		references: [cardsTable.id],
	}),
	pack: one(packsTable, {
		fields: [packCardsTable.packId],
		references: [packsTable.id],
	}),
}));

export const cartProductsTable = pgTable(
	"cart_products",
	{
		id: integer().notNull().primaryKey().generatedAlwaysAsIdentity(),
		userName: varchar({ length: 30 })
			.references(() => usersTable.name)
			.notNull(),
		cardId: integer().references(() => cardsTable.id),
		packId: integer().references(() => packsTable.id),
		quantity: integer().notNull().default(1),
	},
	(table) => [
		unique("unique_cart_product")
			.on(table.userName, table.cardId, table.packId)
			.nullsNotDistinct(),
		check(
			"cart_product_check",
			sql`(
				(${table.cardId} is not null and ${table.packId} is null)
				or
				(${table.packId} is not null and ${table.cardId} is null)
			)`,
		),
	],
);

export const cartProductsRelations = relations(
	cartProductsTable,
	({ one }) => ({
		card: one(cardsTable, {
			fields: [cartProductsTable.cardId],
			references: [cardsTable.id],
		}),
		pack: one(packsTable, {
			fields: [cartProductsTable.packId],
			references: [packsTable.id],
		}),
	}),
);
