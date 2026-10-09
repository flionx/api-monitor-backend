import type { ChannelConfig, ChannelType, DiscordConfig, TelegramConfig } from "@/db/schema.js";
import z from "zod";

const telegramConfigSchema = z.object({
    botToken: z.string().regex(/^\d+:[\w-]{30,}$/, "Invalid Telegram bot token"),
    chatId: z.union([z.string().min(1), z.number().int()]).transform(String)
}) satisfies z.ZodType<TelegramConfig>;

export const DISCORD_WEBHOOK_REGEX =
    /^(https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks)\/(\d+)\/([\w-]+)$/;

const discordConfigSchema = z.object({
    webhookUrl: z.string().regex(DISCORD_WEBHOOK_REGEX, "Invalid Discord webhook URL")
}) satisfies z.ZodType<DiscordConfig>;

export const channelConfigSchemas = {
    telegram: telegramConfigSchema,
    discord: discordConfigSchema
} satisfies Record<ChannelType, z.ZodType<ChannelConfig>>;

export const createChannelSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("telegram"), config: telegramConfigSchema }),
    z.object({ type: z.literal("discord"), config: discordConfigSchema })
]);

export const updateChannelSchema = z.object({
    config: z.record(z.string(), z.unknown())
});

export const channelIdParamSchema = z.object({
    id: z.coerce.number().int().positive()
});

export type CreateChannelDto = z.infer<typeof createChannelSchema>;
export type UpdateChannelDto = z.infer<typeof updateChannelSchema>;
