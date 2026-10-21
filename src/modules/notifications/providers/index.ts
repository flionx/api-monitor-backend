import type { ChannelConfig, ChannelType, DiscordConfig, TelegramConfig } from "@/db/schema.js";
import { TelegramProvider } from "./telegram.provider.js";
import { DiscordProvider } from "./discord.provider.js";

export async function sendViaChannel(
    channel: { type: ChannelType; config: ChannelConfig },
    text: string
) {
    switch (channel.type) {
        case "telegram": {
            return TelegramProvider.send(channel.config as TelegramConfig, text);
        }
        case "discord": {
            return DiscordProvider.send(channel.config as DiscordConfig, text);
        }
        default: {
            const _exhaustive: never = channel.type;
            throw new Error(`Unsupported channel type: ${_exhaustive}`);
        }
    }
}
