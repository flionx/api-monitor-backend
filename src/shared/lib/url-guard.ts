import { BlockList, isIP } from "node:net";
import { env } from "../config/env.js";

const IPV4_RANGES: Array<[string, number]> = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4]
];

const IPV6_RANGES: Array<[string, number]> = [
    ["::", 128],
    ["::1", 128],
    ["64:ff9b::", 96],
    ["100::", 64],
    ["2001::", 32],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["fc00::", 7],
    ["fe80::", 10],
    ["ff00::", 8]
];

const blockList = new BlockList();
for (const [network, prefix] of IPV4_RANGES) blockList.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of IPV6_RANGES) blockList.addSubnet(network, prefix, "ipv6");

export function isBlockedIp(address: string) {
    if (env.ALLOW_PRIVATE_TARGETS) return false;

    const ip = address.split("%")[0] ?? address;
    const family = isIP(ip);
    if (family === 0) return true;

    return blockList.check(ip, family === 4 ? "ipv4" : "ipv6");
}

export function getUrlViolation(url: URL): string | null {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "Only http and https URLs are allowed";
    }
    if (url.username || url.password) {
        return "URL must not contain credentials";
    }
    if (env.ALLOW_PRIVATE_TARGETS) return null;

    // WHATWG URL already normalizes 0x7f.1 / 2130706433 to dotted decimal
    const host = url.hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, "")
        .replace(/\.$/, "");

    if (
        host === "localhost" ||
        host.endsWith(".localhost") ||
        host.endsWith(".local") ||
        host.endsWith(".internal")
    ) {
        return "Local addresses are not allowed";
    }
    if (isIP(host) !== 0 && isBlockedIp(host)) {
        return "Private or reserved IP addresses are not allowed";
    }
    return null;
}
