import { pgTable, boolean, integer, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const monitors = pgTable('monitors', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    intervalSeconds: integer('interval_seconds').default(60).notNull(),
    timeoutMs: integer('timeout_ms').default(5000).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});