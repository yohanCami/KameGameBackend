import { type GetColumnData, sql } from "drizzle-orm";
import type { PgColumn, PgSelect } from "drizzle-orm/pg-core";

export const withPagination = <T extends PgSelect>(
	qb: T,
	page: number,
	pageSize: number,
) => {
	return qb.limit(pageSize).offset((page - 1) * pageSize);
};

export const fullTextSearchSql = <T extends PgColumn>(
	tableColumn: T,
	value: GetColumnData<T, "raw">,
) => {
	return sql`to_tsvector('english', ${tableColumn}) @@ to_tsquery('english', ${value})`;
};
