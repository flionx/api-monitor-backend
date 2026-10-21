import type { TelegramConfig } from "@/db/schema.js";
import { postJson, truncate } from "./utils.js";
import { DeliveryError } from "@/shared/errors/index.js";

const TELEGRAM_MAX_LENGTH = 4096;

export class TelegramProvider {
    static async send(config: TelegramConfig, text: string) {
        const res = await postJson(
            `https://api.telegram.org/bot${config.botToken}/sendMessage`,
            {
                chat_id: config.chatId,
                text: truncate(text, TELEGRAM_MAX_LENGTH),
                disable_web_page_preview: true
            },
            "Telegram"
        );

        if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { description?: string } | null;
            throw new DeliveryError(`Telegram: ${body?.description ?? `HTTP ${res.status}`}`);
        }
    }
}
