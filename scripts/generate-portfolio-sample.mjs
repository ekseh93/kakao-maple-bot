/* global console */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { aggregateUsage } from './usage-lib.mjs';

const syntheticCommands = [
  ['2026-08-22', 'help', 'success', 38],
  ['2026-08-22', 'character', 'success', 640],
  ['2026-08-22', 'hotDeals', 'success', 910],
  ['2026-08-22', 'weather', 'error', 3000],
  ['2026-08-23', 'help', 'success', 34],
  ['2026-08-23', 'symbol', 'success', 22],
  ['2026-08-23', 'stock', 'success', 480],
  ['2026-08-23', 'hotDeals', 'error', 3000],
  ['2026-08-24', 'help', 'success', 41],
  ['2026-08-24', 'character', 'success', 590],
  ['2026-08-24', 'experience', 'success', 760],
  ['2026-08-24', 'weather', 'success', 520],
  ['2026-08-25', 'help', 'success', 29],
  ['2026-08-25', 'union', 'success', 820],
  ['2026-08-25', 'hotDeals', 'success', 870],
  ['2026-08-26', 'help', 'success', 36],
  ['2026-08-26', 'lunaSweet', 'success', 410],
  ['2026-08-26', 'lunaDream', 'success', 430],
  ['2026-08-26', 'unknown', 'bypass', 1],
  ['2026-08-27', 'help', 'success', 44],
  ['2026-08-27', 'character', 'success', 610],
  ['2026-08-27', 'hotDeals', 'success', 940],
  ['2026-08-28', 'help', 'success', 31],
  ['2026-08-28', 'weather', 'success', 510],
  ['2026-08-28', 'fortune', 'success', 18],
];

const records = syntheticCommands.map(([date, command, outcome, latencyMs], index) => ({
  event: 'anonymous-command-usage',
  date,
  command,
  outcome,
  latencyMs,
  cacheStatus: index % 3 === 0 ? 'miss' : 'hit',
}));
const report = aggregateUsage(records, {
  generatedAt: '2026-08-28T00:00:00.000Z',
  sample: true,
});
const outputPath = resolve('docs/portfolio/command-usage.sample.json');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Wrote synthetic portfolio sample: ${outputPath}`);
