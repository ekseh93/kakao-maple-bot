import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => file !== 'pnpm-lock.yaml');

const placeholderPrefixes = ['REPLACE', 'YOUR', 'CHANGE', 'PLACEHOLDER'];
const isPlaceholder = (value) =>
  placeholderPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}_`));

const assignmentKeys = ['NEXON_API_KEY', 'KIS_APP_SECRET', 'BOT_SHARED_SECRET'];
const checks = [
  {
    label: 'sensitive environment assignment',
    pattern: new RegExp(`(?:${assignmentKeys.join('|')})=([^\\s'"]{8,})`, 'g'),
  },
  { label: 'Bearer credential', pattern: /\bBearer\s+([A-Za-z0-9_-]{20,})\b/g },
  {
    label: 'sharedSecret literal',
    pattern: /sharedSecret\s*:\s*['"]([A-Za-z0-9_-]{20,})['"]/g,
  },
];

const findings = [];

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\0')) continue;

  for (const { label, pattern } of checks) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const value = match[1];
      if (isPlaceholder(value)) continue;
      const line = content.slice(0, match.index).split('\n').length;
      findings.push(`${file}:${line} ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Potential secrets found; values are redacted:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log('Secret check passed: no credential-like tracked values found.');
}
