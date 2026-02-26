type CounterName =
  | 'http_requests_total'
  | 'http_rate_limited_total'
  | 'cache_hits_total'
  | 'cache_misses_total'
  | 'queue_jobs_enqueued_total'
  | 'queue_jobs_completed_total'
  | 'queue_jobs_failed_total';

type HistogramName = 'http_duration_ms';

interface CounterMap {
  [key: string]: number;
}

const counters: CounterMap = {};
const histograms: Record<string, number[]> = {};

function keyWithLabels(name: string, labels?: Record<string, string | number>) {
  if (!labels) return name;
  const sorted = Object.keys(labels)
    .sort()
    .map((key) => `${key}=${String(labels[key])}`)
    .join(',');
  return sorted ? `${name}{${sorted}}` : name;
}

export function incrementCounter(
  name: CounterName,
  labels?: Record<string, string | number>,
  value = 1
) {
  const key = keyWithLabels(name, labels);
  counters[key] = (counters[key] || 0) + value;
}

export function observeHistogram(
  name: HistogramName,
  value: number,
  labels?: Record<string, string | number>
) {
  const key = keyWithLabels(name, labels);
  if (!histograms[key]) histograms[key] = [];
  histograms[key].push(value);
}

export function snapshotMetrics() {
  return {
    counters: { ...counters },
    histograms: Object.fromEntries(
      Object.entries(histograms).map(([key, values]) => [
        key,
        {
          count: values.length,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
          avg:
            values.length > 0
              ? Number((values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(2))
              : 0,
        },
      ])
    ),
  };
}
