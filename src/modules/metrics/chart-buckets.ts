export const BUCKET_ORIGIN = new Date("2000-01-01T00:00:00.000Z");

const ORIGIN_MS = BUCKET_ORIGIN.getTime();

export function alignToBucket(timeMs: number, bucketMs: number) {
    return ORIGIN_MS + Math.floor((timeMs - ORIGIN_MS) / bucketMs) * bucketMs;
}

export function listBucketStarts(fromMs: number, toMs: number, bucketMs: number) {
    const starts: number[] = [];
    for (let t = alignToBucket(fromMs, bucketMs); t <= toMs; t += bucketMs) {
        starts.push(t);
    }
    return starts;
}
