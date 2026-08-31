/* global console, process */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { aggregateUsage } from './usage-lib.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputPath = option('--input');
const outputPath = option('--output');
if (!inputPath || !outputPath) {
  console.error(
    'Usage: node scripts/aggregate-usage.mjs --input <audit.jsonl> --output <report.json>',
  );
  process.exit(1);
}

const lines = (await readFile(resolve(inputPath), 'utf8')).split(/\r?\n/).filter(Boolean);
const records = [];
for (const line of lines) {
  try {
    const parsed = JSON.parse(line);
    if (parsed?.event === 'anonymous-command-usage') records.push(parsed);
    else if (typeof parsed?.message === 'string') {
      try {
        const nested = JSON.parse(parsed.message);
        if (nested?.event === 'anonymous-command-usage') records.push(nested);
      } catch {
        // Ignore non-audit CloudWatch envelope messages.
      }
    }
  } catch {
    // Ignore non-JSON log lines.
  }
}

const report = aggregateUsage(records);
const resolvedOutput = resolve(outputPath);
await mkdir(dirname(resolvedOutput), { recursive: true });
await writeFile(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Wrote sanitized usage report: ${resolvedOutput}`);
