import type { MonitorStatus } from "@/db/schema.js";

export interface MonitorState {
    status: MonitorStatus;
    consecutiveFailures: number;
}

export interface Evaluation extends MonitorState {
    notify: boolean;
}

export function evaluateCheck(state: MonitorState, isUp: boolean, threshold: number): Evaluation {
    if (isUp) {
        return { status: "up", consecutiveFailures: 0, notify: state.status === "down" };
    }

    const consecutiveFailures = state.consecutiveFailures + 1;

    if (consecutiveFailures >= threshold) {
        return { status: "down", consecutiveFailures, notify: state.status !== "down" };
    }
    return { status: "down", consecutiveFailures, notify: false };
}
