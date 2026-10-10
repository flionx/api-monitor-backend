import type { DiscordConfig, TelegramConfig } from "@/db/schema.js";
import { postJson, truncate } from "./utils.js";
import { DeliveryError } from "@/shared/errors/index.js";

const DISCORD_MAX_LENGTH = 2000;

export class DiscordProvider {
    static async send(config: DiscordConfig, text: string) {
        const res = await postJson(
            config.webhookUrl,
            {
                text: truncate(text, DISCORD_MAX_LENGTH),
                allowed_mentions: { parse: [] }
            },
            "Discord"
        );

        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { message?: string } | null;
            throw new DeliveryError(`Discord: ${body?.message ?? `HTTP ${res.status}`}`);
        }
    }
}
