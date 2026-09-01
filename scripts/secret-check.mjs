import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { findSecretLikeValues } from './secret-check-core.mjs';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((file) => file !== 'pnpm-lock.yaml');

const findings = [];

for (const file of trackedFiles) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\0')) continue;

  for (const { label, line } of findSecretLikeValues(content))
    findings.push(`${file}:${line} ${label}`);
}

if (findings.length > 0) {
  console.error('Potential secrets found; values are redacted:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log('Secret check passed: no credential-like tracked values found.');
}
