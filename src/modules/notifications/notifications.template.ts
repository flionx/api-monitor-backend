export interface MonitorCheck {
    monitor: { id: number; name: string; url: string };
    isUp: boolean;
    statusCode: number | null;
    responseTimeMs: number;
    errorMessage: string | null;
    checkedAt: Date;
    consecutiveFailures: number;
}

export const DEFAULT_DOWN_TEMPLATE = `🔴 {{monitor.name}} is {{status}}\n{{monitor.url}}\nReason: {{error}}\nStatus code: {{statusCode}}\nFailed checks in a row: {{failures}}`;
export const DEFAULT_UP_TEMPLATE = `🟢 {{monitor.name}} is {{status}}\n{{monitor.url}}\nResponse time: {{responseTimeMs}}ms`;

export const TEMPLATE_VARIABLES = [
    "monitor.name",
    "monitor.url",
    "status",
    "statusCode",
    "error",
    "responseTimeMs",
    "checkedAt",
    "failures"
] as const;

function buildVariables(check: MonitorCheck): Record<string, string> {
    return {
        "monitor.name": check.monitor.name,
        "monitor.url": check.monitor.url,
        status: check.isUp ? "UP" : "DOWN",
        statusCode: check.statusCode === null ? "n/a" : String(check.statusCode),
        error: check.errorMessage ?? "n/a",
        responseTimeMs: String(check.responseTimeMs),
        checkedAt: check.checkedAt.toISOString(),
        failures: String(check.consecutiveFailures)
    };
}

const PLACEHOLDER_REGEX = /\{\{\s*([\w.]+)\s*\}\}/g;

export function getTemplateWarnings(template: string | null) {
    if (!template) return [];

    const known = new Set<string>(TEMPLATE_VARIABLES);
    const keys = new Set([...template.matchAll(PLACEHOLDER_REGEX)].map((m) => m[1]!));
    const warnings: string[] = [];

    for (const key of keys) {
        if (!known.has(key)) {
            warnings.push(`Unknown placeholder {{${key}}}`);
        }
    }

    if (!keys.has("status")) {
        warnings.push("Template has no {{status}}: UP and DOWN alerts will look identical");
    }

    return warnings;
}

export function renderMessage(template: string | null, check: MonitorCheck) {
    const source = template ?? (check.isUp ? DEFAULT_UP_TEMPLATE : DEFAULT_DOWN_TEMPLATE);
    const variables = buildVariables(check);
    return source.replace(PLACEHOLDER_REGEX, (match, key: string) => variables[key] ?? match);
}
