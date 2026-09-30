import { pgTable, boolean, integer, serial, text, timestamp, pgEnum, jsonb, primaryKey } from "drizzle-orm/pg-core";

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

export const channelTypeEnum = pgEnum('channel_type', ['telegram', 'discord']);

export const notificationChannels = pgTable('notification_channels', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: channelTypeEnum('type').notNull(),
    config: jsonb('config').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const monitorChannels = pgTable('monitor_channels',
    {
        monitorId: integer('monitor_id').notNull()
            .references(() => monitors.id, { onDelete: "cascade" }),
        channelId: integer('channel_id').notNull()
            .references(() => notificationChannels.id, { onDelete: "cascade" }),
        message: text('message'),
        isEnabled: boolean('is_enabled').default(true).notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.monitorId, table.channelId] })
    ]
)