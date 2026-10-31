import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const workspace = sqliteTable('workspace', { id: text('id').primaryKey(), data: text('data').notNull(), version: integer('version').notNull().default(0) });
// Bounded, ordered chunks let a scheduled coordinator read the full portfolio
// through the read-only Sites database connector without cell truncation.
export const contextChunks = sqliteTable('coordinator_context', {id:integer('id').primaryKey(),content:text('content').notNull(),version:integer('version').notNull()});
