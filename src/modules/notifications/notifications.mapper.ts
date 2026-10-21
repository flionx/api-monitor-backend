import type { DiscordConfig, notificationChannels, TelegramConfig } from "@/db/schema.js";
import { DISCORD_WEBHOOK_REGEX } from "./notifications.schema.js";

export type NotificationChannel = typeof notificationChannels.$inferSelect;
const MASK = "****";

function maskTail(value: string, visible = 4) {
    return value.length <= visible ? MASK : `${MASK}${value.slice(-visible)}`;
}

function maskTelegramToken(token: string) {
    const separatorIndex = token.indexOf(":");
    if (separatorIndex === -1) return MASK;

    const botId = token.slice(0, separatorIndex);
    const secret = token.slice(separatorIndex + 1);

    if (!botId || !secret) {
        return MASK;
    }

    return `${botId}:${maskTail(secret)}`;
}

function maskDiscordWebhook(url: string): string {
    const match = url.match(DISCORD_WEBHOOK_REGEX);
    if (!match) {
        return MASK;
    }

    const [, baseUrl, id, token] = match;
    if (!baseUrl || !id || !token) {
        return MASK;
    }

    return `${baseUrl}/${id}/${maskTail(token)}`;
}

function maskConfig(channel: NotificationChannel) {
    switch (channel.type) {
        case "telegram": {
            const { chatId, botToken } = channel.config as TelegramConfig;
            return { chatId, botToken: maskTelegramToken(botToken) };
        }
        case "discord": {
            const { webhookUrl } = channel.config as DiscordConfig;
            return { webhookUrl: maskDiscordWebhook(webhookUrl) };
        }
        default: {
            const _exhaustive: never = channel.type;
            throw new Error(`Unsupported channel type: ${_exhaustive}`);
        }
    }
}

export function toPublicChannel(channel: NotificationChannel) {
    return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        config: maskConfig(channel),
        createdAt: channel.createdAt
    };
}
