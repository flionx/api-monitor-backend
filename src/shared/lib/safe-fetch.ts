import dns from "node:dns";
import type { LookupFunction } from "node:net";
import { Agent, fetch } from "undici";
import { getUrlViolation, isBlockedIp } from "./url-guard.js";

export class SsrfError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SsrfError";
    }
}

const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const guardedLookup: LookupFunction = (hostname, options, callback) => {
    dns.lookup(hostname, options, (err, address, family) => {
        if (err) return callback(err, address, family);

        const addresses = Array.isArray(address) ? address.map((a) => a.address) : [address];
        if (addresses.some(isBlockedIp)) {
            return callback(
                new SsrfError("Target resolves to a private or reserved address"),
                address,
                family
            );
        }
        callback(null, address, family);
    });
};

const dispatcher = new Agent({ connect: { lookup: guardedLookup } });

interface SafeFetchInit {
    signal: AbortSignal;
    headers?: Record<string, string>;
}

export async function safeFetch(url: string, init: SafeFetchInit) {
    let current = url;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        const parsed = new URL(current);

        const violation = getUrlViolation(parsed);
        if (violation) {
            throw new SsrfError(violation);
        }

        const response = await fetch(parsed, {
            method: "GET",
            redirect: "manual",
            signal: init.signal,
            ...(init.headers ? { headers: init.headers } : {}),
            dispatcher
        });

        await response.body?.cancel();

        const location = response.headers.get("location");
        if (!REDIRECT_STATUSES.has(response.status) || !location) {
            return { status: response.status, ok: response.ok };
        }
        current = new URL(location, parsed).toString();
    }

    throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
}
