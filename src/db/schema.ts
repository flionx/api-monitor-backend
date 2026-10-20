import {
    pgTable,
    boolean,
    integer,
    serial,
    text,
    timestamp,
    pgEnum,
    jsonb,
    primaryKey,
    bigserial,
    index
} from "drizzle-orm/pg-core";

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull()
});

export const monitorStatusEnum = pgEnum("monitor_status", ["unknown", "up", "down"]);
export type MonitorStatus = (typeof monitorStatusEnum.enumValues)[number];

export const monitors = pgTable("monitors", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    intervalSeconds: integer("interval_seconds").default(60).notNull(),
    timeoutMs: integer("timeout_ms").default(5000).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    failureThreshold: integer("failure_threshold").default(1).notNull(),
    status: monitorStatusEnum("status").default("unknown").notNull(),
    consecutiveFailures: integer("consecutive_failures").default(0).notNull(),
    lastCheckedAt: timestamptz("last_checked_at"),
    lastResponseTimeMs: integer("last_response_time_ms"),
    lastErrorMessage: text("last_error_message"),
    createdAt: timestamptz("created_at").defaultNow().notNull()
});

export const channelTypeEnum = pgEnum("channel_type", ["telegram", "discord"]);
export type ChannelType = (typeof channelTypeEnum.enumValues)[number];

export interface TelegramConfig {
    chatId: string;
    botToken: string;
}
export interface DiscordConfig {
    webhookUrl: string;
}
export type ChannelConfig = TelegramConfig | DiscordConfig;

export const notificationChannels = pgTable("notification_channels", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: channelTypeEnum("type").notNull(),
    config: jsonb("config").$type<ChannelConfig>().notNull(),
    createdAt: timestamptz("created_at").defaultNow().notNull()
});

export const monitorChannels = pgTable(
    "monitor_channels",
    {
        monitorId: integer("monitor_id")
            .notNull()
            .references(() => monitors.id, { onDelete: "cascade" }),
        channelId: integer("channel_id")
            .notNull()
            .references(() => notificationChannels.id, { onDelete: "cascade" }),
        message: text("message"),
        isEnabled: boolean("is_enabled").default(true).notNull()
    },
    (table) => [primaryKey({ columns: [table.monitorId, table.channelId] })]
);

export const checkErrorTypeEnum = pgEnum("check_error_type", [
    "timeout",
    "server_error",
    "client_error",
    "connection",
    "unknown"
]);
export type CheckErrorType = (typeof checkErrorTypeEnum.enumValues)[number];

export const checks = pgTable(
    "checks",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        monitorId: integer("monitor_id")
            .notNull()
            .references(() => monitors.id, { onDelete: "cascade" }),
        statusCode: integer("status_code"),
        responseTimeMs: integer("response_time_ms"),
        isUp: boolean("is_up").notNull(),
        errorType: checkErrorTypeEnum("error_type"),
        errorMessage: text("error_message"),
        checkedAt: timestamptz("checked_at").defaultNow().notNull()
    },
    (table) => [
        index("idx_checks_monitor_time").on(table.monitorId, table.checkedAt),
        index("idx_checks_checked_at").on(table.checkedAt)
    ]
);

// todo: add incidents?
