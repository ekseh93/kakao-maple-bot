const OUTCOMES = new Set(['success', 'error', 'bypass']);
const CACHE_STATUSES = new Set(['hit', 'miss', 'stale', 'bypass']);

export function sanitizeAuditRecord(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.event !== 'anonymous-command-usage') return null;
  if (typeof value.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return null;
  if (typeof value.command !== 'string' || !/^[A-Za-z][A-Za-z0-9]*$/.test(value.command))
    return null;
  if (!OUTCOMES.has(value.outcome) || !CACHE_STATUSES.has(value.cacheStatus)) return null;
  if (typeof value.latencyMs !== 'number' || !Number.isFinite(value.latencyMs)) return null;
  return {
    date: value.date,
    command: value.command,
    outcome: value.outcome,
    latencyMs: Math.max(0, Math.min(600_000, Math.round(value.latencyMs))),
    cacheStatus: value.cacheStatus,
  };
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function aggregateUsage(
  records,
  { generatedAt = new Date().toISOString(), sample = false } = {},
) {
  const days = new Map();
  for (const value of records) {
    const record = sanitizeAuditRecord(value);
    if (!record) continue;
    const day = days.get(record.date) ?? {
      total: 0,
      commands: {},
      outcomes: { success: 0, error: 0, bypass: 0 },
      latencies: [],
    };
    day.total += 1;
    day.commands[record.command] = (day.commands[record.command] ?? 0) + 1;
    day.outcomes[record.outcome] += 1;
    day.latencies.push(record.latencyMs);
    days.set(record.date, day);
  }

  const daily = [...days.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, day]) => ({
      date,
      total: day.total,
      commands: Object.fromEntries(
        Object.entries(day.commands).sort(([left], [right]) => left.localeCompare(right)),
      ),
      outcomes: day.outcomes,
      latencyMs: {
        average: Math.round(
          day.latencies.reduce((sum, value) => sum + value, 0) / day.latencies.length,
        ),
        p50: percentile(day.latencies, 50),
        p95: percentile(day.latencies, 95),
        max: Math.max(...day.latencies),
      },
    }));

  return {
    schemaVersion: 1,
    reportType: 'anonymous-command-usage',
    sample,
    generatedAt,
    days: daily,
  };
}
