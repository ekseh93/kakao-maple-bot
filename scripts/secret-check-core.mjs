const placeholderPrefixes = ['REPLACE', 'YOUR', 'CHANGE', 'PLACEHOLDER'];
const isPlaceholder = (value) =>
  placeholderPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}_`));
const isReference = (value) =>
  /^(?:var|local|module|process\.env|env)\.[A-Za-z0-9_.-]+$/.test(value) ||
  /^\$\{[A-Za-z0-9_.-]+\}$/.test(value);

const assignmentKeys = ['NEXON_API_KEY', 'KIS_APP_SECRET', 'BOT_SHARED_SECRET'];
const checks = [
  {
    label: 'sensitive environment assignment',
    pattern: new RegExp(
      `(?:${assignmentKeys.join('|')})[ \\t]*=[ \\t]*(?:"([^"\\r\\n]{8,})"|'([^'\\r\\n]{8,})'|([^\\s'"]{8,}))`,
      'g',
    ),
  },
  { label: 'Bearer credential', pattern: /\bBearer\s+([A-Za-z0-9_-]{20,})\b/g },
  {
    label: 'sharedSecret literal',
    pattern: /sharedSecret\s*:\s*['"]([A-Za-z0-9_-]{20,})['"]/g,
  },
];

export function findSecretLikeValues(content) {
  const findings = [];

  for (const { label, pattern } of checks) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const value = match.slice(1).find(Boolean);
      if (!value || isPlaceholder(value) || isReference(value)) continue;
      const line = content.slice(0, match.index).split('\n').length;
      findings.push({ label, line });
    }
  }

  return findings;
}
