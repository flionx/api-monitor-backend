export interface MonitorCheck {
    monitor: { id: number; name: string; url: string };
    isUp: boolean;
    statusCode: number;
    responseTimeMs: number;
    errorMessage: string | null;
    checkedAt: Date;
}

export const DEFAULT_DOWN_TEMPLATE = `🔴 {{monitor.name}} is {{status}}\n{{monitor.url}}\nReason: {{error}}\nStatus code: {{statusCode}}`;
export const DEFAULT_UP_TEMPLATE = `🟢 {{monitor.name}} is {{status}}\n{{monitor.url}}\nResponse time: {{responseTimeMs}}ms`;

export const TEMPLATE_VARIABLES = [
    "monitor.name",
    "monitor.url",
    "status",
    "statusCode",
    "responseTimeMs",
    "checkedAt"
] as const;

function buildVariables(check: MonitorCheck): Record<string, string> {
    return {
        "monitor.name": check.monitor.name,
        "monitor.url": check.monitor.url,
        status: check.isUp ? "UP" : "DOWN",
        statusCode: check.statusCode === null ? "n/a" : String(check.statusCode),
        responseTimeMs: String(check.responseTimeMs),
        checkedAt: check.checkedAt.toISOString()
    };
}

export function renderMessage(template: string | null, check: MonitorCheck) {
    const source = template ?? (check.isUp ? DEFAULT_UP_TEMPLATE : DEFAULT_DOWN_TEMPLATE);
    const variables = buildVariables(check);
    return source.replace(
        /\{\{\s*([\w.]+)\s*\}\}/g,
        (match, key: string) => variables[key] ?? match
    );
}
