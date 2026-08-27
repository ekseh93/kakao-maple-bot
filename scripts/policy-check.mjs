/* global console, process */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps', 'packages', 'tests'];
const forbiddenFetch =
  /(?:fetch|axios|got|https?:\/\/[^\s'"`]+)\([^)]*(?:maple\.gg|maplescouter\.com)/i;
const secretAssignment =
  /(?:NEXON_API_KEY|KIS_APP_SECRET|BOT_SHARED_SECRET)\s*=\s*['"`]\s*[^\s'"`]{8,}/;
const violations = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(?:ts|js|json|jsonc)$/.test(entry)) {
      const source = readFileSync(path, 'utf8');
      if (forbiddenFetch.test(source)) violations.push(`${path}: third-party automatic access`);
      if (secretAssignment.test(source)) violations.push(`${path}: possible secret assignment`);
    }
  }
}

for (const root of roots) walk(root);
if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    'Policy check passed: no forbidden third-party access or obvious secret assignments.',
  );
}
