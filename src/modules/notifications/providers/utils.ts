import { DeliveryError } from "@/shared/errors/index.js";

const REQUEST_TIMEOUT_MS = 5000;

export async function postJson(url: string, body: unknown, providerName: string) {
    try {
        return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
    } catch (err) {
        const reason =
            err instanceof Error && err.name === "TimeoutError"
                ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
                : "Network error";
        throw new DeliveryError(`${providerName}: ${reason}`);
    }
}

export function truncate(text: string, maxLength: number) {
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}
